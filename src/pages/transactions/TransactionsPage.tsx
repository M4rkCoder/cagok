import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Transaction, Category, TransactionFormValues } from "@/types";
import { TransactionWithCategory } from "@/types/transaction";
import DailyExpenseCalendar from "@/components/DailyExpenseCalendar";

// Simple modal component (copied from CategoriesPage.tsx)
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "300px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h2>{title}</h2>
        {children}
        <button onClick={onClose} style={{ marginTop: "10px" }}>
          Close
        </button>
      </div>
    </div>
  );
};

// Rewritten TransactionForm (similar to CategoryForm)
interface TransactionFormProps {
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
  defaultValues?: Transaction;
  categories: Category[]; // Pass categories to link transaction to a category
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  categories,
}) => {
  const [description, setDescription] = useState(
    defaultValues?.description || ""
  );
  const [amount, setAmount] = useState(defaultValues?.amount || 0);
  const [date, setDate] = useState(
    defaultValues?.date || new Date().toISOString().split("T")[0]
  ); // YYYY-MM-DD
  const [type, setType] = useState<0 | 1>(defaultValues?.type ?? 1); // Default to Expense
  const [isFixed, setIsFixed] = useState<0 | 1>(defaultValues?.is_fixed ?? 0); // Default to Variable
  const [remarks, setRemarks] = useState(defaultValues?.remarks || "");
  const [categoryId, setCategoryId] = useState(defaultValues?.category_id);

  useEffect(() => {
    console.log("TransactionForm: categories prop updated:", categories);
  }, [categories]);

  useEffect(() => {
    console.log("TransactionForm: categoryId state updated:", categoryId);
  }, [categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description: description || undefined,
      amount: Number(amount),
      date,
      type: type,
      is_fixed: isFixed,
      remarks: remarks ?? undefined,
      category_id: categoryId ?? undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "10px" }}
    >
      <div>
        <label htmlFor="description">Description:</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
      </div>
      <div>
        <label htmlFor="amount">Amount:</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          required
          style={{ width: "100%", padding: "8px" }}
        />
      </div>
      <div>
        <label htmlFor="date">Date:</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          style={{ width: "100%", padding: "8px" }}
        />
      </div>
      <div>
        <label htmlFor="type">Type:</label>
        <select
          id="type"
          value={type}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value === 0 || value === 1) {
              setType(value);
            }
          }}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="0">Income</option>
          <option value="1">Expense</option>
        </select>
      </div>
      <div>
        <label htmlFor="isFixed">Fixed/Variable:</label>
        <select
          id="isFixed"
          value={isFixed}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value === 0 || value === 1) {
              setIsFixed(value);
            }
          }}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="0">Variable</option>
          <option value="1">Fixed</option>
        </select>
      </div>
      <div>
        <label htmlFor="remarks">Remarks:</label>
        <textarea
          id="remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: "8px" }}
          placeholder="Optional memo or note"
        />
      </div>
      <div>
        <label htmlFor="category_id">Category:</label>
        <select
          id="category_id"
          value={categoryId || ""}
          onChange={(e) =>
            setCategoryId(
              e.target.value !== "" ? parseInt(e.target.value, 10) : undefined
            )
          }
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">No Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.icon})
            </option>
          ))}
        </select>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit">Save</button>
      </div>
    </form>
  );
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(
    []
  );
  const [categories, setCategories] = useState<Category[]>([]); // To display category name in table
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const fetchedTransactions = await invoke<Transaction[]>(
        "get_transactions_with_category"
      );
      console.log("Fetched transactions:", fetchedTransactions);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await invoke<Category[]>("get_categories");
      console.log("Fetched categories:", fetchedCategories);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error(
        "Failed to fetch categories for transactions:",
        JSON.stringify(error)
      );
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories(); // Fetch categories to link to transactions
  }, []);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleNew = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await invoke("delete_transaction", { id });
        fetchTransactions(); // Refetch after deleting
      } catch (error) {
        console.error("Failed to delete transaction:", JSON.stringify(error));
      }
    }
  };

  const handleFormSubmit = async (values: TransactionFormValues) => {
    console.log("handleFormSubmit: values before invoke:", values);
    try {
      if (editingTransaction) {
        await invoke("update_transaction", {
          id: editingTransaction.id!,
          transaction: {
            description: values.description,
            amount: values.amount,
            date: values.date,
            type: values.type,
            is_fixed: values.is_fixed,
            remarks: values.remarks ?? null,
            category_id:
              values.category_id !== undefined ? values.category_id : null,
          },
        });
      } else {
        await invoke("create_transaction", {
          transaction: {
            description: values.description,
            amount: values.amount,
            date: values.date,
            type: values.type,
            is_fixed: values.is_fixed,
            remarks: values.remarks ?? null,
            category_id: values.category_id,
          },
        });
      }
      handleDialogClose();
      fetchTransactions(); // Refetch after creating/updating
    } catch (error) {
      console.error("Failed to save transaction:", JSON.stringify(error));
    }
  };

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ fontSize: "24px", margin: 0 }}>Transactions</h1>
        <button
          onClick={handleNew}
          style={{
            padding: "8px 15px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          New Transaction
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Description
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Amount
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Date
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Type
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Fixed/Variable
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Category
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {transaction.description}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {transaction.amount}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {transaction.date}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {transaction.type === 0 ? "Income" : "Expense"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {transaction.is_fixed === 0 ? "Variable" : "Fixed"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {transaction.category_icon} {transaction.category_name}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <button
                      onClick={() => handleEdit(transaction)}
                      style={{ marginRight: "10px", padding: "5px 10px" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id!)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <Modal
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        title={
          editingTransaction ? "Edit Transaction" : "Create New Transaction"
        }
      >
        <TransactionForm
          onSubmit={handleFormSubmit}
          onCancel={handleDialogClose}
          defaultValues={editingTransaction || undefined}
          categories={categories}
        />
      </Modal>
    </div>
  );
};

export default TransactionsPage;
