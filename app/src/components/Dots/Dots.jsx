export default function Dots({ marginTop }) {
  return (
    <div style={{ width: "100%" }}>
      <div
        className="line"
        style={{
          backgroundColor: "#ebebebff",
          width: "100%",
          height: "1px",
          marginTop: marginTop,    
        }}
      ></div>
    </div>
  );
}
