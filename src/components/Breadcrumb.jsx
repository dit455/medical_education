export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span className="breadcrumb-part" key={`${item.label}-${index}`}>
            {item.onClick && !isLast ? (
              <button type="button" onClick={item.onClick}>
                {item.label}
              </button>
            ) : (
              <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
            )}
            {!isLast && <i>/</i>}
          </span>
        );
      })}
    </nav>
  );
}
