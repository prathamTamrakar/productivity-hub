import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  SlidersHorizontal,
  FolderTree,
} from 'lucide-react';

import api from '../api/client';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';

// Money subcomponents
import MoneyFilters from '../components/money/MoneyFilters';
import AccountFormModal from '../components/money/AccountFormModal';
import AccountsList from '../components/money/AccountsList';
import TransactionFormModal from '../components/money/TransactionFormModal';
import TransactionsList from '../components/money/TransactionsList';
import CategoryManager from '../components/money/CategoryManager';
import AnalyticsCharts from '../components/money/AnalyticsCharts';

import './pages.css';

const formatMonthLabel = (monthStr) => {
  if (!monthStr) return '';
  const [y, m] = monthStr.split('-');
  const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
  return dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export default function MoneyPage() {
  const currentMonthStr = format(new Date(), 'yyyy-MM');

  // Month & filter state
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [filters, setFilters] = useState({
    search: '',
    account_id: '',
    category_id: '',
    type: '',
    date_from: '',
    date_to: '',
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Data states
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactionsData, setTransactionsData] = useState({ transactions: [], total: 0 });
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net_savings: 0 });
  const [trendData, setTrendData] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  // Loadings
  const [loading, setLoading] = useState(true);

  // Modals
  const [accountModal, setAccountModal] = useState({ isOpen: false, account: null });
  const [transactionModal, setTransactionModal] = useState({ isOpen: false, transaction: null });
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Initial fetches
  useEffect(() => {
    fetchCoreData();
  }, []);

  // Refetches based on page/filters
  useEffect(() => {
    fetchTransactions();
  }, [page, filters]);

  // Refetches based on selected month
  useEffect(() => {
    fetchMonthlyAnalytics();
  }, [selectedMonth]);

  const fetchCoreData = async () => {
    setLoading(true);
    try {
      const [accRes, catRes] = await Promise.all([
        api.get('/api/money/accounts'),
        api.get('/api/money/categories'),
      ]);
      setAccounts(accRes.data);
      setCategories(catRes.data);
      await Promise.all([
        fetchTransactions(),
        fetchMonthlyAnalytics(),
      ]);
    } catch (err) {
      console.error('Failed to load core Money data:', err);
      toast.error('Failed to load financial workspace');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = {
        page,
        limit,
        ...filters,
      };
      
      // Clean empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      if (params.date_from) params.date_from = new Date(params.date_from).toISOString();
      if (params.date_to) params.date_to = new Date(params.date_to).toISOString();

      const res = await api.get('/api/money/transactions', { params });
      setTransactionsData(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const fetchMonthlyAnalytics = async () => {
    try {
      const [sumRes, trendRes, catRes] = await Promise.all([
        api.get(`/api/money/analytics/summary?month=${selectedMonth}`),
        api.get('/api/money/analytics/trend?range=6m'),
        api.get(`/api/money/analytics/category-breakdown?type=expense&month=${selectedMonth}`),
      ]);
      setSummary(sumRes.data);
      setTrendData(trendRes.data);
      setCategoryBreakdown(catRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  // ACCOUNTS ACTIONS
  const handleAccountSubmit = async (data) => {
    try {
      if (accountModal.account) {
        // Edit Account
        await api.patch(`/api/money/accounts/${accountModal.account.id}`, data);
        toast.success('Wallet updated successfully');
      } else {
        // Create Account
        await api.post('/api/money/accounts', data);
        toast.success('Wallet created successfully');
      }
      setAccountModal({ isOpen: false, account: null });
      fetchCoreData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save account');
    }
  };

  const handleAccountDelete = async (id) => {
    try {
      const res = await api.delete(`/api/money/accounts/${id}`);
      if (res.data && res.data.status === 'warning') {
        return res.data; // Pass up to the list view to trigger strategy popup
      }
      toast.success('Account deleted successfully');
      fetchCoreData();
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  const handleAccountDeleteStrategy = async (id, strategy, targetId) => {
    try {
      let url = `/api/money/accounts/${id}?strategy=${strategy}`;
      if (targetId) url += `&target_account_id=${targetId}`;
      await api.delete(url);
      toast.success('Account deleted successfully');
      fetchCoreData();
    } catch (err) {
      toast.error('Failed to delete account with strategy');
    }
  };

  // TRANSACTIONS ACTIONS
  const handleTransactionSubmit = async (payload) => {
    try {
      if (transactionModal.transaction) {
        // Edit
        await api.patch(`/api/money/transactions/${transactionModal.transaction.id}`, payload);
        toast.success('Transaction updated');
      } else {
        // Create
        await api.post('/api/money/transactions', payload);
        toast.success('Transaction added');
      }
      fetchCoreData();
    } catch (err) {
      throw err; // throw back to modal to display error
    }
  };

  const handleTransactionDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/api/money/transactions/${id}`);
      toast.success('Transaction deleted');
      fetchCoreData();
    } catch (err) {
      toast.error('Failed to delete transaction');
    }
  };

  // CATEGORIES ACTIONS
  const handleCategoryCreate = async (payload) => {
    try {
      await api.post('/api/money/categories', payload);
      toast.success('Category added');
      // Refresh categories list
      const catRes = await api.get('/api/money/categories');
      setCategories(catRes.data);
    } catch (err) {
      throw err;
    }
  };

  const handleCategoryDelete = async (id) => {
    if (!window.confirm('Delete this category? Any transactions under it will be moved to "Others".')) return;
    try {
      await api.delete(`/api/money/categories/${id}`);
      toast.success('Category deleted');
      const catRes = await api.get('/api/money/categories');
      setCategories(catRes.data);
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  // Balance Math
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.current_balance, 0);

  const formatCurrency = (amount) => {
    return (amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="money-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="dashboard-header-title">Money Manager</h1>
          <div className="dashboard-header-date">Track accounts, categories, and financial statistics</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="secondary"
            icon={FolderTree}
            onClick={() => setShowCategoryManager(!showCategoryManager)}
          >
            {showCategoryManager ? 'Hide Categories' : 'Manage Categories'}
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setTransactionModal({ isOpen: true, transaction: null })}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Net Balance"
          value={formatCurrency(totalBalance)}
          icon={Wallet}
          color="primary"
        />
        <StatCard
          label={`Income (${formatMonthLabel(selectedMonth)})`}
          value={formatCurrency(summary.total_income)}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          label={`Expenses (${formatMonthLabel(selectedMonth)})`}
          value={formatCurrency(summary.total_expense)}
          icon={TrendingDown}
          color="danger"
        />
        <StatCard
          label="Net Savings"
          value={formatCurrency(summary.net_savings)}
          icon={PiggyBank}
          color="accent"
        />
      </div>

      {/* Main Grid: Wallets + Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* Category Manager (Toggled) */}
        {showCategoryManager && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
            <CategoryManager
              categories={categories}
              onCreateCategory={handleCategoryCreate}
              onDeleteCategory={handleCategoryDelete}
            />
          </motion.div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Left: wallets list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AccountsList
              accounts={accounts}
              onAddClick={() => setAccountModal({ isOpen: true, account: null })}
              onEditClick={(acc) => setAccountModal({ isOpen: true, account: acc })}
              onDeleteClick={handleAccountDelete}
              onDeleteStrategyConfirm={handleAccountDeleteStrategy}
            />
          </div>
          {/* Right: analytics widgets */}
          <div>
            <AnalyticsCharts
              trendData={trendData}
              categoryData={categoryBreakdown}
              accountBalances={accounts}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ marginTop: '10px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={18} /> Transactions Log
        </h3>
        <MoneyFilters
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1); // Reset page on filter change
          }}
          accounts={accounts}
          categories={categories}
        />
      </div>

      {/* Transactions List */}
      <TransactionsList
        transactions={transactionsData.transactions}
        total={transactionsData.total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onEditClick={(tx) => setTransactionModal({ isOpen: true, transaction: tx })}
        onDeleteClick={handleTransactionDelete}
      />

      {/* Form Modals */}
      <AccountFormModal
        isOpen={accountModal.isOpen}
        onClose={() => setAccountModal({ isOpen: false, account: null })}
        onSubmit={handleAccountSubmit}
        account={accountModal.account}
      />

      <TransactionFormModal
        isOpen={transactionModal.isOpen}
        onClose={() => setTransactionModal({ isOpen: false, transaction: null })}
        onSubmit={handleTransactionSubmit}
        transaction={transactionModal.transaction}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
