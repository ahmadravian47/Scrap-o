import "./App.css";
import { Routes, Route } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Home from "./components/Home/Home";



function App() {
  return (
    <div className="overflow-hidden">
      <Routes>
        <Route path="/" element={<Home />} />
        </Routes>
    </div>
  );
}

export default App;
