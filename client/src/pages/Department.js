import './Department.css';
import LoadingModal from '../components/LoadingModal';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Department page that displays all the departments the API has.
 * This is the main search functionality of the app, as it is the most
 * reliable despite also having its flaws.
 */
export default function Department() {
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [leftCol, setLeftCol] = useState();
  const [rightCol, setRightCol] = useState();

  /**
   * When the user first loads the department page, we need to get the data from
   * the Met API. Only called once, when the first initially renders.
   */
  useEffect(() => {
    async function loadDepartments() {
      try {
        const response = await getDepartments();
        // Splits the results in half to display in separate columns.
        const even = response.departments.filter(
          (element, index) => index % 2 === 0
        );
        const odd = response.departments.filter(
          (element, index) => index % 2 === 1
        );
        setLeftCol(even);
        setRightCol(odd);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsLoading(true);
    loadDepartments();
  }, []);

  // Return the loading modal if we have not gotten our API response yet, and
  // return an error message if there has been an error retrieving data.
  if (isLoading) return <LoadingModal />;
  if (error) return <div className="standard-error">{error.message}</div>;

  // The main returned code. Two columns of DepartmentLink components.
  return (
    <div className="department-wrap">
      <div className="department-row">
        <div className="title-wrap">
          <h1 className="bebas-font">Departments</h1>
        </div>
      </div>
      <div className="department-row">
        <div className="department-col-half left-col">
          {leftCol?.map((department) => (
            <div key={department.departmentId}>
              <DepartmentLink department={department} />
            </div>
          ))}
        </div>
        <div className="department-col-half">
          {rightCol?.map((department) => (
            <div key={department.departmentId}>
              <DepartmentLink department={department} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// The function that requests the server to call the Met API
async function getDepartments() {
  try {
    const departmentsUrl =
      'https://collectionapi.metmuseum.org/public/collection/v1/departments';
    const response = await fetch(departmentsUrl);
    if (!response.ok) {
      throw new Error(
        'Could not load department data, please try again later...'
      );
    }
    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error(err);
  }
}

// The individual DeparmentLink component. Each department gets its own link.
function DepartmentLink({ department }) {
  const name = department.displayName;
  const id = department.departmentId;
  const link = `/department/${id}/1`;
  return (
    <Link to={link} className="department-link">
      <h2 className="department-title">{name}</h2>
    </Link>
  );
}
