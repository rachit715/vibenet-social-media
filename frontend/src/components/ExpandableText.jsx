import { useMemo, useState } from "react";
import HighlightedText from "./HighlightedText";

const ExpandableText = ({
  text = "",
  maxChars = 170,
  textClassName = "",
  buttonClassName = "",
  showLess = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { visibleText, isLong } = useMemo(() => {
    const raw = String(text || "");
    if (raw.length <= maxChars) {
      return { visibleText: raw, isLong: false };
    }

    if (expanded) {
      return { visibleText: raw, isLong: true };
    }

    return { visibleText: `${raw.slice(0, maxChars).trimEnd()}...`, isLong: true };
  }, [expanded, maxChars, text]);

  return (
    <span>
      <HighlightedText
        text={visibleText}
        className={`whitespace-pre-wrap break-words ${textClassName}`}
      />
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={`ml-1 text-xs font-semibold ${buttonClassName}`}
        >
          {expanded ? (showLess ? "see less" : "less") : "see all"}
        </button>
      )}
    </span>
  );
};

export default ExpandableText;
