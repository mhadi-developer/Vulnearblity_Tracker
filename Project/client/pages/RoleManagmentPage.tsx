
"use client";

import React, { useEffect, useState, useMemo } from "react";
import "../styles/global-theme.css";
import "../styles/common.css";
import "../styles/role-managment-page.css";

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface Role {
  id: number;
  role_title: string;
}

interface UserRecord {
  id: number;
  full_name: string;
  user_name: string;
  email: string;
  created_at: string;
  role_id: number | null;
  role: Role | null;
}

interface UsersApiResponse {
  message: string;
  users: UserRecord[];
}

interface RolesApiResponse {
  message: string;
  roles: Role[];
}

type FilterType =
  | "ALL"
  | "UNASSIGNED"
  | "Admin"
  | "Developer"
  | "Analyst";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:8000";

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function RoleManagementPage() {
  // Users
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Roles
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<FilterType>("ALL");

  // Role assignment
  const [updatingUserId, setUpdatingUserId] =
    useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ==========================================
  // FETCH USERS - INDEPENDENT API CALL
  // ==========================================

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError(null);

        const response = await fetch(
          `${API_BASE_URL}/admin/users`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch users.");
        }

        // Expected response:
        // { message: "all users fetched", users: [...] }

        const data: UsersApiResponse = await response.json();

        if (!Array.isArray(data.users)) {
          throw new Error("Invalid users API response.");
        }

        setUsers(data.users);

      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to fetch users.";

        setUsersError(message);

      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ==========================================
  // FETCH ROLES - INDEPENDENT API CALL
  // ==========================================

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        setRolesError(null);

        const response = await fetch(
          `${API_BASE_URL}/admin/roles`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch roles.");
        }

        // Expected response:
        // { message: "all roles fetched", roles: [...] }

        const data: RolesApiResponse = await response.json();

        if (!Array.isArray(data.roles)) {
          throw new Error("Invalid roles API response.");
        }

        setRoles(data.roles);

      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to fetch roles.";

        setRolesError(message);

      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // ==========================================
  // RESOLVE ROLE IDs DYNAMICALLY
  // ==========================================

  const developerRole = useMemo(
    () =>
      roles.find(
        (role) =>
          role.role_title.toLowerCase() === "developer"
      ),
    [roles]
  );

  const analystRole = useMemo(
    () =>
      roles.find(
        (role) =>
          role.role_title.toLowerCase() === "analyst"
      ),
    [roles]
  );

  // ==========================================
  // ASSIGN USER ROLE
  // ==========================================

  const handleAssignRole = async (
    userId: number,
    targetRole: Role | undefined
  ) => {
    if (!targetRole) {
      setToast({
        type: "error",
        message: "Target role is not available.",
      });

      return;
    }

    setUpdatingUserId(userId);
    setToast(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/role?role_id=${targetRole.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.detail || "Failed to update user role."
        );
      }

      // Update local state

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                role_id: targetRole.id,
                role: targetRole,
              }
            : user
        )
      );

      setToast({
        type: "success",
        message: `Assigned "${targetRole.role_title}" successfully.`,
      });

    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Role update failed.";

      setToast({
        type: "error",
        message,
      });

    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // FILTER USERS
  // ==========================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        user.full_name.toLowerCase().includes(query) ||
        user.user_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      const roleTitle = user.role?.role_title.toLowerCase();

      if (activeFilter === "UNASSIGNED") {
        return user.role_id === null;
      }

      if (activeFilter === "Admin") {
        return roleTitle === "admin";
      }

      if (activeFilter === "Developer") {
        return roleTitle === "developer";
      }

      if (activeFilter === "Analyst") {
        return roleTitle === "analyst";
      }

      return true;
    });
  }, [users, searchQuery, activeFilter]);

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const counts = useMemo(() => {
    let unassigned = 0;
    let admins = 0;
    let developers = 0;
    let analysts = 0;

    users.forEach((user) => {
      const title = user.role?.role_title.toLowerCase();

      if (!title) {
        unassigned++;
      } else if (title === "admin") {
        admins++;
      } else if (title === "developer") {
        developers++;
      } else if (title === "analyst") {
        analysts++;
      }
    });

    return {
      total: users.length,
      unassigned,
      admins,
      developers,
      analysts,
    };
  }, [users]);

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // RENDER UI
  // ==========================================

  return (
    <main className="role-page">
      <div className="container">

        {/* HEADER & METRICS */}

        <header className="role-header">
          <div>
            <h1 className="role-title">
              User Role Assignment
            </h1>

            <p className="role-subtitle">
              Assign registered accounts to Developer or Analyst access tiers.
            </p>
          </div>

          <div className="role-stats">

            <div className="stat-pill">
              <span>Total:</span>
              <strong>{counts.total}</strong>
            </div>

            <div className="stat-pill">
              <span>Unassigned:</span>
              <strong>{counts.unassigned}</strong>
            </div>

            <div className="stat-pill">
              <span>Admins:</span>
              <strong>{counts.admins}</strong>
            </div>

            <div className="stat-pill">
              <span>Developers:</span>
              <strong>{counts.developers}</strong>
            </div>

            <div className="stat-pill">
              <span>Analysts:</span>
              <strong>{counts.analysts}</strong>
            </div>

          </div>
        </header>

        {/* API STATUS */}

        {rolesError && (
          <div className="toast-banner error" role="alert">
            Roles unavailable: {rolesError}
          </div>
        )}

        {usersError && (
          <div className="toast-banner error" role="alert">
            Users unavailable: {usersError}
          </div>
        )}

        {/* SEARCH & FILTERS */}

        <section className="role-controls">

          <input
            type="text"
            className="search-input"
            placeholder="Search by full name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div
            className="filter-tabs"
            role="tablist"
            aria-label="Filter users by role"
          >
            {(
              [
                "ALL",
                "UNASSIGNED",
                "Admin",
                "Developer",
                "Analyst",
              ] as FilterType[]
            ).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`btn filter-tab ${
                  activeFilter === tab ? "active" : ""
                }`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab === "ALL"
                  ? "All Users"
                  : tab === "UNASSIGNED"
                  ? "Pending Role"
                  : `${tab}s`}
              </button>
            ))}
          </div>

        </section>

        {/* TOAST */}

        {toast && (
          <div
            className={`toast-banner ${toast.type}`}
            role="status"
          >
            <span>{toast.message}</span>

            <button
              type="button"
              onClick={() => setToast(null)}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontWeight: 700,
              }}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* USERS GRID */}

        {usersLoading ? (
          <div className="empty-state">
            Loading registered users...
          </div>
        ) : usersError ? (
          <div className="empty-state">
            Unable to load registered users.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            No registered users match the current filter.
          </div>
        ) : (

          <section className="users-grid">

            {filteredUsers.map((user) => {
              const currentRoleTitle =
                user.role?.role_title.toLowerCase();

              const isDev = currentRoleTitle === "developer";
              const isAnalyst = currentRoleTitle === "analyst";
              const isAdmin = currentRoleTitle === "admin";

              const isUpdating =
                updatingUserId === user.id;

              return (
                <article
                  key={user.id}
                  className="user-card lift"
                >

                  {/* USER IDENTITY */}

                  <div className="user-card-top">

                    <div className="user-identity">

                      <div className="user-avatar">
                        {getInitials(user.full_name)}
                      </div>

                      <div>
                        <h2 className="user-name">
                          {user.full_name}
                        </h2>

                        <p className="user-handle">
                          @{user.user_name} · {user.email}
                        </p>

                        <p className="user-handle">
                          Joined: {formatDate(user.created_at)}
                        </p>
                      </div>

                    </div>

                    {/* ROLE BADGE */}

                    <span
                      className={`role-badge ${
                        isAdmin
                          ? "admin"
                          : isDev
                          ? "developer"
                          : isAnalyst
                          ? "analyst"
                          : "unassigned"
                      }`}
                    >
                      {user.role?.role_title || "Unassigned"}
                    </span>

                  </div>

                  {/* ROLE ASSIGNMENT */}

                  <div className="user-card-actions">

                    <span className="action-label">
                      Assign Role:
                    </span>

                    <div className="role-toggle-group">

                      <button
                        type="button"
                        disabled={
                          rolesLoading ||
                          !!rolesError ||
                          !developerRole ||
                          isUpdating ||
                          isDev ||
                          isAdmin
                        }
                        className={`btn role-btn ${
                          isDev ? "selected-dev" : ""
                        }`}
                        onClick={() =>
                          handleAssignRole(
                            user.id,
                            developerRole
                          )
                        }
                      >
                        {isUpdating && !isDev
                          ? "Updating..."
                          : "Developer"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          rolesLoading ||
                          !!rolesError ||
                          !analystRole ||
                          isUpdating ||
                          isAnalyst ||
                          isAdmin
                        }
                        className={`btn role-btn ${
                          isAnalyst
                            ? "selected-analyst"
                            : ""
                        }`}
                        onClick={() =>
                          handleAssignRole(
                            user.id,
                            analystRole
                          )
                        }
                      >
                        {isUpdating && !isAnalyst
                          ? "Updating..."
                          : "Analyst"}
                      </button>

                    </div>

                    {rolesLoading && (
                      <small>Loading available roles...</small>
                    )}

                    {!rolesLoading &&
                      !rolesError &&
                      !developerRole &&
                      !analystRole && (
                        <small>
                          Developer and Analyst roles are not configured.
                        </small>
                      )}

                  </div>

                </article>
              );
            })}

          </section>
        )}

      </div>
    </main>
  );
}
