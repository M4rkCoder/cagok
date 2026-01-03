import React, { useState } from "react";
import "./App.css";
import CategoriesPage from "./pages/CategoriesPage";
import TransactionsPage from "./pages/TransactionsPage";

function App() {
  const [currentPage, setCurrentPage] = useState<'categories' | 'transactions'>('categories');

  return (
    <main className="container" style={{ fontFamily: 'sans-serif' }}>
      <nav style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <button 
          onClick={() => setCurrentPage('categories')} 
          style={{ 
            marginRight: '10px', 
            padding: '8px 15px', 
            backgroundColor: currentPage === 'categories' ? '#007bff' : '#f0f0f0', 
            color: currentPage === 'categories' ? 'white' : 'black', 
            border: 'none', 
            borderRadius: '5px' 
          }}
        >
          Categories
        </button>
        <button 
          onClick={() => setCurrentPage('transactions')} 
          style={{ 
            padding: '8px 15px', 
            backgroundColor: currentPage === 'transactions' ? '#007bff' : '#f0f0f0', 
            color: currentPage === 'transactions' ? 'white' : 'black', 
            border: 'none', 
            borderRadius: '5px' 
          }}
        >
          Transactions
        </button>
      </nav>

      {currentPage === 'categories' && <CategoriesPage />}
      {currentPage === 'transactions' && <TransactionsPage />}
    </main>
  );
}

export default App;
