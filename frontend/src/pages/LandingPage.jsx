import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="container text-center mt-5">
      <h1>Welcome to ZEST Data Service</h1>
      <p>Please log in or register to continue</p>
      <Link to="/login" className="btn btn-primary mx-2">Login</Link>
      <Link to="/register" className="btn btn-secondary mx-2">Register</Link>
    </div>
  );
}