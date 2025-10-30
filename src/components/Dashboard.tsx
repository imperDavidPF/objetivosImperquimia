// Dashboard.tsx
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import type { DepartmentStats, Objective, OwnerStats } from '../types/types';

interface DashboardProps {
  objectivesData: Objective[];
  currentDepartment: string;
  isDepartmentView: boolean;
  departmentColors: Record<string, string>;
  onFilterDepartment: (department: string) => void;
  onSelectDepartment: (department: string) => void;
  onSelectOwner: (owner: string, department: string) => void;
  complianceValue: number;
}

export const Dashboard = ({
  objectivesData,
  currentDepartment,
  isDepartmentView,
  departmentColors: _departmentColors, // Prefijado con _ para indicar que no se usa
  onFilterDepartment,
  onSelectDepartment,
  onSelectOwner,
  complianceValue
}: DashboardProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Obtener departamentos únicos
  const departments = [...new Set(objectivesData.map(item => item.department))];

  // Generar colores para departamentos
  const generateDepartmentColors = (depts: string[]) => {
    const colors = [
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 99, 132, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 205, 86, 0.7)',
      'rgba(201, 203, 207, 0.7)',
    ];
    
    const colorMap: Record<string, string> = {};
    depts.forEach((dept, index) => {
      colorMap[dept] = colors[index % colors.length];
    });
    
    return colorMap;
  };

  // Calcular estadísticas por departamento
  const calculateDepartmentStats = (): DepartmentStats[] => {
    const departmentMap: Record<string, DepartmentStats> = {};
    
    objectivesData.forEach(item => {
      const dept = item.department;
      
      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          department: dept,
          objectives: [],
          totalProgress: 0,
          avgProgress: 0,
          objectiveCount: 0
        };
      }
      
      departmentMap[dept].objectives.push(item);
      departmentMap[dept].totalProgress += item.progress;
    });
    
    const departmentStats = Object.values(departmentMap).map(deptData => {
      const avgProgress = deptData.totalProgress / deptData.objectives.length;
      return {
        ...deptData,
        avgProgress: Math.round(avgProgress * 100) / 100,
        objectiveCount: deptData.objectives.length
      };
    });
    
    return departmentStats.sort((a, b) => b.avgProgress - a.avgProgress);
  };

  // Calcular estadísticas por propietario
  const calculateOwnerStats = (): OwnerStats[] => {
    const ownerMap: Record<string, OwnerStats> = {};
    
    objectivesData.forEach(item => {
      if (currentDepartment && item.department !== currentDepartment) {
        return;
      }
      
      const key = `${item.owner}|${item.department}`;
      
      if (!ownerMap[key]) {
        ownerMap[key] = {
          owner: item.owner,
          department: item.department,
          objectives: [],
          totalProgress: 0,
          avgProgress: 0,
          objectiveCount: 0
        };
      }
      
      ownerMap[key].objectives.push(item);
      ownerMap[key].totalProgress += item.progress;
    });
    
    const ownerStats = Object.values(ownerMap).map(ownerData => {
      const avgProgress = ownerData.totalProgress / ownerData.objectives.length;
      return {
        ...ownerData,
        avgProgress: Math.round(avgProgress * 100) / 100,
        objectiveCount: ownerData.objectives.length
      };
    });
    
    return ownerStats.sort((a, b) => b.avgProgress - a.avgProgress);
  };

  // Actualizar gráfico de departamentos
  const updateGlobalChartDepartments = () => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destruir gráfico anterior
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const departmentStats = calculateDepartmentStats();
    const colors = generateDepartmentColors(departments);

    if (departmentStats.length === 0) {
      // Mostrar mensaje si no hay datos
      ctx.font = '16px Arial';
      ctx.fillStyle = '#7f8c8d';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos disponibles para mostrar', chartRef.current.width / 2, chartRef.current.height / 2);
      return;
    }

    const labels = departmentStats.map(dept => dept.department);
    const data = departmentStats.map(dept => dept.avgProgress);
    const backgroundColors = labels.map(dept => colors[dept] || 'rgba(201, 203, 207, 0.7)');

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Avance Promedio (%)',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Porcentaje de Avance'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Departamentos'
            },
            ticks: {
              callback: function(value) {
                const label = this.getLabelForValue(value as number);
                return label.length > 15 ? label.substring(0, 15) + '...' : label;
              }
            }
          }
        },
        onClick: (_event, elements) => { // Prefijado con _ para indicar que no se usa
          if (elements.length > 0) {
            const index = elements[0].index;
            const department = departmentStats[index].department;
            onSelectDepartment(department);
          }
        }
      }
    });
  };

  // Actualizar gráfico de propietarios
  const updateGlobalChartOwners = () => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ownerStats = calculateOwnerStats();
    const colors = generateDepartmentColors(departments);

    if (ownerStats.length === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#7f8c8d';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos disponibles para mostrar', chartRef.current.width / 2, chartRef.current.height / 2);
      return;
    }

    const labels = ownerStats.map(owner => owner.owner);
    const data = ownerStats.map(owner => owner.avgProgress);
    const departmentsList = ownerStats.map(owner => owner.department);
    const backgroundColors = departmentsList.map(dept => colors[dept] || 'rgba(201, 203, 207, 0.7)');

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Avance Promedio (%)',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Porcentaje de Avance'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Propietarios'
            },
            ticks: {
              callback: function(value) {
                const label = this.getLabelForValue(value as number);
                return label.length > 15 ? label.substring(0, 15) + '...' : label;
              }
            }
          }
        },
        onClick: (_event, elements) => { // Prefijado con _ para indicar que no se usa
          if (elements.length > 0) {
            const index = elements[0].index;
            const owner = ownerStats[index].owner;
            const department = ownerStats[index].department;
            onSelectOwner(owner, department);
          }
        }
      }
    });
  };

  // Efecto para actualizar gráfico cuando cambian los datos
  useEffect(() => {
    if (isDepartmentView) {
      updateGlobalChartDepartments();
    } else {
      updateGlobalChartOwners();
    }

    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [objectivesData, currentDepartment, isDepartmentView]);

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 80) return 'linear-gradient(135deg, #2ecc71, #27ae60)';
    if (compliance >= 50) return 'linear-gradient(135deg, #f39c12, #e67e22)';
    return 'linear-gradient(135deg, #e74c3c, #c0392b)';
  };

  return (
    <div className="dashboard">
      <div className="card full-width-chart">
        <h2 id="chartTitle">
          {isDepartmentView ? 'Gráfico de Avance por Departamento' : `Gráfico de Avance - ${currentDepartment}`}
        </h2>
        <div className="department-filter">
          <label htmlFor="departmentSelect">Filtrar por Departamento:</label>
          <select 
            id="departmentSelect" 
            value={currentDepartment}
            onChange={(e) => onFilterDepartment(e.target.value)}
          >
            <option value="">Todos los departamentos</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="chart-container">
          <canvas ref={chartRef} id="globalChart"></canvas>
        </div>
      </div>
      
      <div className="compliance-panel">
        <div 
          className="compliance-card" 
          style={{ background: getComplianceColor(complianceValue) }}
        >
          <div className="compliance-label">Cumplimiento del Departamento</div>
          <div className="compliance-value">{complianceValue}%</div>
          <div>{currentDepartment || 'Todos los Departamentos'}</div>
        </div>
      </div>
    </div>
  );
};