(function () {
  window.InquirexConfig = {
    trigger: "click",
    triggerDelay: 1000,
    position: "bottom-right",
    llmTimeout: 20000,
    launcherMode: "standard",
    launcherSelector: "",
    theme: {
      headerBg: "#2563eb",
      headerText: "#ffffff",
      brand: "#2563eb",
      background: "#ffffff",
      text: "#1c1917",
      highlight: "#2563eb",
      bubbleAnswerBg: "#2563eb",
      bubbleAnswerText: "#ffffff",
      launcherBg: "#2563eb",
      headerFont: "Noto Sans",
      headerFontSize: "18px",
      "--iq-header-font-weight": "700",
      "--iq-header-line-height": "1.3",
      font: "Noto Sans",
      fontSize: "15px",
      "--iq-font-weight": "400",
      "--iq-line-height": "1.5",
      radius: "18px",
      padding: "16px",
    },
    url: "https://qualified.at/api/flows/9ab45eaa-5f58-4ffe-bf2c-22129078a507",
    submitUrl:
      "https://qualified.at/api/flows/9ab45eaa-5f58-4ffe-bf2c-22129078a507/answers",
    llmUrl:
      "https://qualified.at/api/flows/9ab45eaa-5f58-4ffe-bf2c-22129078a507/llm",
    auth: "eyJfcmFpbHMiOnsiZGF0YSI6eyJzaXRlX2lkIjoiOWFiNDVlYWEtNWY1OC00ZmZlLWJmMmMtMjIxMjkwNzhhNTA3In0sInB1ciI6IndpZGdldCJ9fQ==--27725cbe2bf9237446ef94334746a7eb5d3a78610ff8152f76a02da734303b4c",
  };
  console.info(
    "[inquirex] widget runtime not yet vendored; window.InquirexConfig is baked. See inquirex/inquirex-js#2.",
  );
})();

