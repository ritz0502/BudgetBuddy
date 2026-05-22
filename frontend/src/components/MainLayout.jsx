import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet /> {/* This renders HomePage or QuizPage */}
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;