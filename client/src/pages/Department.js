import './Department.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Department() {
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [leftCol, setLeftCol] = useState();
  const [rightCol, setRightCol] = useState();

  useEffect(() => {
    async function loadDepartments() {
      try {
        const response = await getDepartments();
        console.log('Departments are: ', response);
        const even = response.departments.filter(
          (element, index) => index % 2 === 0
        );
        const odd = response.departments.filter(
          (element, index) => index % 2 === 1
        );
        setLeftCol(even);
        setRightCol(odd);
        // console.log('Evens: ', even)
        // console.log('Odds: ', odd);
        // console.log('Departments: ', response);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsLoading(true);
    loadDepartments();
  }, []);

  if (isLoading) return <div>Loading data...</div>;
  if (error) return <div>{error.message}</div>;

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
    console.log('Error here!: ', err);
    throw new Error(err);
  }
}

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
