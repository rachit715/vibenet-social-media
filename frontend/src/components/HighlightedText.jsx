const tokenRegex = /([@#][\w.]+)/g;
const isTagToken = /^[@#][\w.]+$/;

const HighlightedText = ({ text = '', className = '' }) => {
  const parts = String(text).split(tokenRegex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        isTagToken.test(part) ? (
          <span key={`${part}-${index}`} className="text-[#6f86ff]">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </span>
  );
};

export default HighlightedText;
