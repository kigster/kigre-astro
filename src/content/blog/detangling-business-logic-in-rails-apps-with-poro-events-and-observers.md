---
title: "Detangling Business Logic in Rails Apps with PORO Events and Observers"
date: 2013-08-05
permalink: "/2013/08/05/detangling-business-logic-in-rails-apps-with-poro-events-and-observers.html"
category: "programming"
tags: ["ruby on rails", "observable", "ventable", "even-driven", "rails 5"]
description: "With any Rails app that evolves along with substantial user growth and active feature development, pretty soon a moment comes when there appears to be a decent amount of tangled logic, AKA technical debt."
heroImage: "/assets/images/posts/ruby/rails-models.png"
comments: true
author: kig
---
## Business Logic in Rails.. Oh my!

With any Rails app that evolves along with substantial user growth and active feature development, pretty soon a moment comes when there appears to be a decent amount of tangled logic, AKA "technical debt."

A typical example would be a user registration controller's "register" action, which upon a successful registration might coordinate a bunch of actions related to the registration but unrelated to one another, such as:

. Sending the user a welcome email
. Logging an analytics event for future reporting
. Queueing up a job to notify user's Facebook friends
. Running a check against a spam database of IP addresses to validate the new account
. Running recommendation engine logic to suggest topics to follow

These are all concerns that are independent of one another, but happen when a user registers._ Some of these actions happen immediately, some even within a single transaction, and some asynchronously (in another thread, or in a background job).

This topic has been given a lot of discussion on [this famous thread](https://gist.github.com/justinko/2838490), where even [DHH](http://david.heinemeierhansson.com/) chimed in. We'll use the example discussed in that thread, and the version that DHH presented (slightly compacted) below. Basically, a controller that's creating a comment and then performing a bunch of related actions, such as posting to Twitter and Facebook, or running it through a spam check.

```ruby
class PostsController
  def create
    @entry = current_user.entries.find(params[:id])
    return head(:bad_request) if SpamChecker.spammy?(params[:post][:body])

    @comment = @entry.comments.
                      create!(params[:post].
                        permit(:title, :body).
                        merge(author: current_user))
    Notifications.new_comment(@comment).deliver
    if @comment.share_on_twitter?
      TwitterPoster.new(current_user, @comment.body).post
    end
    if @comment.share_on_facebook?
      FacebookPoster.new(current_user, @comment.body).
         action(:comment)
    end
  end
end
```

In this blog post we'll examine an event-based approach to decoupling this business logic, a method that's been pretty successful within the Wanelo codebase thus far.

### Simple World

In a small Rails application it might be tempting to put this type of logic _directly on the controller_ as DHH did above, but this approach, while simple and easy to understand, might make things a bit difficult as the application matures. For one, testing this action becomes a challenge: many unrelated services need to be stubbed out, and many permutations tested. What if a Twitter post succeeds, but a Facebook post doesn't? In other words, these concerns become "tightly coupled" inside the controller. And what if we want to also create comments from another place, perhaps an API controller? This certainly applied to our case at Wanelo.

A possible solution could be to _split the logic into various methods on the ActiveRecord Comment model, and implement them as callbacks,_ such as after_create. Unfortunately this approach suffers from similar problems: many of the above actions do not belong inside the model, and will only pollute it with tangled code and external dependencies. Why does the Comment model need to know about posting to Facebook or a spam checker? This certainly is a matter of taste, but experience shows that attaching this behavior directly onto the model does not work out well in the long run, as the model classes become bloated and full of external dependencies.

Another solution could be to create a layer of "services" -- standalone plain Ruby classes, which then _encapsulate_ this logic in one place, and then multiple controllers can just call into it. This is the approach that the author of the thread proposed. While I do think that this solution is better than stuffing this logic into the controller, and assuming it's valuable to have this logic be reusable, it still crams these concerns together, making that class challenging to test.

#### Ultimate Goal?

It's really important to decide what our goals are. At Wanelo, we want to be able to _build software that's easy to change,_ and to adapt to the _constantly moving product requirements_ and experiments, as well as to the high-scalability demands of the popular site that we've become.

We want code that's easily testable, easy to understand, and easy to maintain. Tangled code of unrelated concerns inside controllers, models or services does not meet this standard: it's hard to test, and could be hard to change (assuming many more layers are added on top of the simple example, which tends to happen in larger apps).

#### Events to the Rescue

Events and event-driven architecture offer a nice design pattern for splitting this logic into self-contained units (observers), which can declare interest in a certain business event independently of one another. When an event happens, observers get notified. It's pretty straightforward, but it moves the dependency association into _subscribing_ each observer to the event.

Ruby's [Observable](http://ruby-doc.org/stdlib-2.0/libdoc/observer/rdoc/Observable.html) module provides a very simple way to create observers and tie them to an "observable" event (which is a class including the module).

But we found ourselves wanting a bit more. For starters, it's nice to encapsulate events into plain Ruby classes that might wrap some useful event data (for example, a comment object, for the CommentPublishedEvent). Another feature we wanted was the ability to notify a group of observers within a transaction block, and others outside of the transaction.

#### Ventable to the Rescue

Enter [Ventable](https://github.com/kigster/ventable): a very simple plain Ruby gem that implements the Observer pattern in a slightly more flexible way, and provides convenient configuration DSL that makes connecting events to interested observers (or listeners) declarative. This "connecting" logic goes into your Rails initializer folder, and provides a nice "map" of what happens when important business events happen.

Here is an example of how things might be _connected_ in your application based on the previous example:

```ruby
require 'ventable'
class CommentCreatedEvent
  include Ventable::Event
  attr_accessor :user, :comment
  def initialize(user, comment)
    @user = user
    @comment = comment
  end
end
# config/event_initializer.rb
CommentCreatedEvent.configure do
  notifies Notifications,
           TwitterService,
           FacebookService,
           SpamChecker
end

# lib somewhere
class TwitterService
  # implementation skipped...
  def self.handle_comment_created event
    if event.comment.share_on_twitter?
      self.new(event.user).post_comment(event.comment.body)
    end
  end
end

class FacebookService
  # implementation skipped...
  def self.handle_comment_created event
  if event.comment.share_on_facebook?
    new(event.user).post_comment(event.comment.body)
  end
end

# SpamChecker skipped for brevity

# app/controllers/post_controller.rb
class PostsController
  def create
    @entry = current_user.entries.find(params[:id])
    @comment = @entry.comments.
                 create!(params[:post].
                 permit(:title, :body).
                 merge(author: current_user))

    CommentCreatedEvent.new(current_user, @comment).fire!
  end
end
```

There is a lot going on above, but it's also pretty obvious what's happening -- another power of this eventing approach. First we are defining a `CommentCreatedEvent` class, to wrap `user` and `comment` instances, and then we configure this event using the DSL to notify several observers (which in this case are all ruby classes). We can now use generic FacebookService and TwitterService (which could encapsulate multiple Twitter and Facebook operations; a plus in my book), which all have a callback method, called by the eventing gem upon firing the event.

#### Diving Deeper*

In Wanelo code base, we currently have 30 distinct events, which are all fired at various points throughout the life cycle of our application. Some events are fired in web request, some during background jobs. Currently Ventable dispatch mechanism only supports in-process ruby observers, but it would not be difficult to extend it to support a queueing mechanism, such as RabbitMQ.

We defined a hierarchy of events in `lib/wanelo/events` directory of our rails app, and they all subclass a `Base` class. This class defines a couple of additional features.

* It automatically includes `Ventable::Event` in each subclass of the Base class

* It defines a transaction block that is then used (when defining individual events) to notify some observers inside the transaction, and some outside of it.  We do this so that database transaction is not left open unnecessarily for too long -- operations such as as posting to Facebook can take seconds to complete. Keeping database transactions as short as possible is pretty much required for any high-traffic web application.

* It automatically subscribes each concrete event (ie, a subclass of base) to metrics module, which transmits a UDP packet to our statsd metrics aggregator, for each of the 30 events in our app

Let's take a look at what this looks like:

```ruby
module Wanelo
  module Event
    class Base
      class << self
        def transaction
          @transaction ||= ->(b) {
            ActiveRecord::Base.transaction do
              b.call
            end
          }
        end

        def metrics
          @metrics ||= Wanelo::Metrics.instance \
            if defined?(Wanelo::Metrics)
        end
      end

      def self.inherited(klass)
        klass.instance_eval do
          include Ventable::Event
          group :transaction, &Wanelo::Event::Base.transaction

          # Always notify statsd
          notifies ->(event) { self.metrics.handle_event(event) }
        end
      end
    end
  end
end
```

By defining the `transaction` group and binding it to the proc, we are able to use `inside:` option when configuring events, such as so:

```ruby
Wanelo::Event::ProductSave.configure do
  notifies Product,
           SaveNotification,
           SaveAction,
           inside: :transaction

  notifies ProductSaveWorker,
           ResaveEmailWorker
end
```

Ventable calls all observers in the order defined in the configuration. The first four observers are called inside the transaction block, while the last two are called after the transaction had already committed.

### Pros and Cons

#### Advantages

Modeling business events as actual Ruby classes has many advantages, that might not be obvious from the get-go. For example, as we can see from the example above, it is trivial to subscribe a global concern such as _metrics listener_ to ALL interesting events at once. With just a few lines of code we can suddenly enable tracking and graphing every interesting business metric that is modeled in code as a Ventable event. This is very powerful.

Another obvious advantage of this approach is that the code pieces relating to a particular piece of functionality can be placed inside classes implementing this functionality. In the above example, the code to post the comment to Twitter could live inside the TwitterService class, instead of inside some arbitrary controller.

Finally, it becomes very easy to see how the events are dispatched and glued together by reviewing the `event_initializer.rb` file, which we tend to keep in our `config/initializers` folder. Whenever you see a "handle_event" method anywhere, quickly open up event initializer and you can see what the other interested parties of this event are, what order they are being called, and whether they are executing inside a transaction.

#### Disadvantages

There are a few downsides to this approach, however. As software developers we should always look for the trade offs between solutions, and try to understand what we gain or lose with each implementation.

In this case, there are a couple I can think of:

* It may not be trivial to figure out ALL of the actions that happen when a certain event fires. One must inspect event_initializer.rb in order to figure this out.

* If firing some events causes other events to also fire (not recommended!), it may further complicate debugging the exact sequence of actions that happened.

* If "around" blocks are used, such as in a transaction, nested events may further obscure what happens inside the outer or inner transaction boundary.

Having said that, our experience shows that a healthy mix of the Service design pattern and the events, provides the best-of-breed solution and achieving very modular approach to business logic modeling. It allows us to easily create new event types, and even more easily to configure any part of our app to be notified when the event fires.
