// src/Assessment/AssessPA.jsx
import "./AssessPA.css";
import { useNavigate } from "react-router-dom";

export default function AssessPA() {
  const navigate = useNavigate();

  const experiments = [
    { id: 1, name: 'Write a C program to draw various graphics objects (Pixel, Circle, Line, Ellipse, Rectangle, Triangle, Polygon) using graphics functions.' },
    { id: 2, name: 'Write a C program to draw line using DDA algorithm.' },
    { id: 3, name: 'Write a C program to draw line using Bresenhams algorithm.' },
    { id: 4, name: 'Write a C program to draw circle using Bresenhams algorithm.' },
    { id: 5, name: 'Write a C program for Flood fill algorithm of polygon filling.' },
    { id: 6, name: 'Write a C program for Boundary fill algorithm of polygon filling.' },
    { id: 7, name: 'Write a C program for 2D Translation and Scaling.' },
    { id: 8, name: 'Write a C program for 2D Rotation. ' },
    { id: 9, name: 'Write a C program for 2D Reflection and Shear.' },
    { id: 10, name:'Write a C program for 3D Translation and Scaling.' },
    { id: 11, name:'Write a C program for 3D Rotation.' },
    { id: 12, name:'Write a C program for Line Clipping using Cohen-Sutherland .' },
    { id: 13, name:'Write a C program for Line Clipping using Midpoint Subdivision algorithm.' },
    { id: 14, name:'Write a C program for Sutherland Hodgeman Polygon Clipping.' },
    { id: 15, name:'Write a C program for Bezier Curve.' },
  ];

  const handleAssess = (expId) => {
    // Pass experiment ID via route state or query if needed
    navigate("/assesspastudentlist", { state: { expId } });
  };

  return (
    <div className="assess-container">
      <h3 className="assess-title">Progressive Assessment</h3>

      <div className="table-responsive">
        <table className="table table-bordered table-hover table-striped">
          <thead className="table-light">
            <tr>
              <th>Exp ID</th>
              <th>Exp Name</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((exp) => (
              <tr key={exp.id}>
                <td>{exp.id}</td>
                <td>{exp.name}</td>
                <td>
                  <button
                    className="btn btn-outline-primary btn-sm btn-assess"
                    onClick={() => handleAssess(exp.id)}
                  >
                    Assess
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
