import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Category } from "@/types";

// Simple modal component
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

// Rewritten CategoryForm
interface CategoryFormProps {
  onSubmit: (values: { name: string; icon: string; type: string }) => void;
  onCancel: () => void;
  defaultValues?: Category;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
}) => {
  const [name, setName] = useState(defaultValues?.name || "");
  const [icon, setIcon] = useState(defaultValues?.icon || "");
  const [type, setType] = useState(defaultValues?.type?.toString() || "1"); // Default to Expense

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, icon, type });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "10px" }}
    >
      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: "100%", padding: "8px" }}
        />
      </div>
      <div>
        <label htmlFor="icon">Icon:</label>
        <input
          id="icon"
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          required
          style={{ width: "100%", padding: "8px" }}
        />
      </div>
      <div>
        <label htmlFor="type">Type:</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="0">Income</option>
          <option value="1">Expense</option>
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

const SettingsPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const fetchedCategories = await invoke<Category[]>("get_categories");
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleNew = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await invoke("delete_category", { id });
        fetchCategories(); // Refetch after deleting
      } catch (error) {
        console.error("Failed to delete category:", error);
      }
    }
  };

  const handleFormSubmit = async (values: {
    name: string;
    icon: string;
    type: string;
  }) => {
    const payload = {
      ...values,
      type: parseInt(values.type, 10),
    };

    try {
      if (editingCategory) {
        await invoke("update_category", {
          id: editingCategory.id!,
          ...payload,
        });
      } else {
        await invoke("create_category", payload);
      }
      handleDialogClose();
      fetchCategories(); // Refetch after creating/updating
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
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
        <h1 style={{ fontSize: "24px", margin: 0 }}>Settings</h1>
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
          New Category
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
                Icon
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Name
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      fontSize: "20px",
                    }}
                  >
                    {category.icon}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {category.name}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {category.type === 0 ? "Income" : "Expense"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <button
                      onClick={() => handleEdit(category)}
                      style={{ marginRight: "10px", padding: "5px 10px" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id!)}
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
        title={editingCategory ? "Edit Category" : "Create New Category"}
      >
        <CategoryForm
          onSubmit={handleFormSubmit}
          onCancel={handleDialogClose}
          defaultValues={editingCategory || undefined}
        />
      </Modal>
    </div>
  );
};

export default SettingsPage;
