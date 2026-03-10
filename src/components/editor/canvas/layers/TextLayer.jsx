import React from "react";

const TextLayer = React.memo(function TextLayer({ renderedTexts }) {
  return <>{renderedTexts}</>;
});

export default TextLayer;
