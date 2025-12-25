import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHospital, FaTruck } from 'react-icons/fa';

export default function MainDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Suppliers',
      icon: <FaTruck size={40} />,
      description: 'Register or login as a supplier.',
      onClick: () => navigate('/supplier-auth')
    },
    {
      title: 'Hospitals',
      icon: <FaHospital size={40} />,
      description: 'Register or login as a hospital.',
      onClick: () => navigate('/hospital-auth')
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to right, #ffecd2, #fcb69f)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: '40px', color: '#333' }}>Welcome to the Dashboard</h1>
      <div style={{ display: 'flex', gap: '40px' }}>
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            style={{
              cursor: 'pointer',
              padding: '30px',
              width: '220px',
              textAlign: 'center',
              borderRadius: '15px',
              boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
              background: 'white',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 25px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
            }}
          >
            <div style={{ marginBottom: '15px', color: '#ff7e5f' }}>{card.icon}</div>
            <h2 style={{ marginBottom: '10px', color: '#333' }}>{card.title}</h2>
            <p style={{ color: '#666' }}>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
