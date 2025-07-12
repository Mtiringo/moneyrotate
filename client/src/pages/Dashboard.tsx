import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Users, DollarSign, Calendar, MessageCircle, Settings, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, formatDate, cn } from "../lib/utils";

interface Pool {
  id: string;
  name: string;
  description: string;
  monthlyAmount: string;
  adminId: string;
  isActive: boolean;
  currentRound: number;
  startDate: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pools");

  const { data: pools = [], isLoading } = useQuery({
    queryKey: ["/api/pools"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">PoolPay</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => setActiveTab("pools")}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === "pools"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  My Pools
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === "payments"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  Payments
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/pools/new">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>New Pool</span>
                </button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {user?.firstName?.[0] || user?.email?.[0] || "U"}
                  </span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.firstName || user?.email}
                </span>
                <button
                  onClick={() => window.location.href = '/api/logout'}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === "pools" && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Pools</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pools.length}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Pools</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {pools.filter((pool: Pool) => pool.isActive).length}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(
                        pools.reduce((sum: number, pool: Pool) => sum + parseFloat(pool.monthlyAmount), 0)
                      )}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pools Grid */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Pools</h2>
              {pools.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No pools yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create your first money pool to get started with group savings.
                  </p>
                  <Link href="/pools/new">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                      Create Your First Pool
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pools.map((pool: Pool) => (
                    <Link key={pool.id} href={`/pools/${pool.id}`}>
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {pool.name}
                            </h3>
                            <span className={cn(
                              "px-2 py-1 text-xs font-medium rounded-full",
                              pool.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            )}>
                              {pool.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                            {pool.description || "No description"}
                          </p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Monthly Amount</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(pool.monthlyAmount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Round</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {pool.currentRound}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Started</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatDate(pool.startDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>Members</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>Chat</span>
                              </div>
                            </div>
                            {pool.adminId === user?.id && (
                              <div className="flex items-center space-x-1 text-sm text-blue-600">
                                <Settings className="h-4 w-4" />
                                <span>Admin</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment History</h2>
            <p className="text-gray-600 dark:text-gray-400">Payment history will be displayed here.</p>
          </div>
        )}
      </main>
    </div>
  );
}