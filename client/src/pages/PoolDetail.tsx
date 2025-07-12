import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Users, MessageCircle, CreditCard, Send, UserPlus } from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { formatCurrency, formatDate } from "../lib/utils";

export default function PoolDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [messageText, setMessageText] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: poolData, isLoading } = useQuery({
    queryKey: ["/api/pools", id],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/pools/${id}/messages`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pools", id] });
      setMessageText("");
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", `/api/pools/${id}/invite`, { email });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "The invitation has been sent successfully!",
      });
      setInviteEmail("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      inviteMemberMutation.mutate(inviteEmail.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!poolData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Pool not found</h2>
          <Link href="/">
            <button className="text-blue-600 hover:text-blue-700">Back to Dashboard</button>
          </Link>
        </div>
      </div>
    );
  }

  const { pool, members = [], messages = [], payouts = [] } = poolData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back</span>
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{pool.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatCurrency(pool.monthlyAmount)} monthly • Round {pool.currentRound}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                pool.isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
              }`}>
                {pool.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {["overview", "members", "chat", "payments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pool Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pool Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Description</label>
                  <p className="text-gray-900 dark:text-white">{pool.description || "No description"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Monthly Amount</label>
                  <p className="text-gray-900 dark:text-white">{formatCurrency(pool.monthlyAmount)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Start Date</label>
                  <p className="text-gray-900 dark:text-white">{formatDate(pool.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Total Members</label>
                  <p className="text-gray-900 dark:text-white">{members.length}</p>
                </div>
              </div>
            </div>

            {/* Payout Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payout Order</h2>
              <div className="space-y-3">
                {members.map((member: any, index: number) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{member.position}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {member.user.firstName || member.user.email}
                        </p>
                        {member.userId === user?.id && (
                          <span className="text-xs text-blue-600">You</span>
                        )}
                      </div>
                    </div>
                    <div>
                      {member.hasReceived ? (
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full">
                          Received
                        </span>
                      ) : member.position === pool.currentRound ? (
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
                          Current
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Members</h2>
                {pool.adminId === user?.id && (
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Manage
                  </button>
                )}
              </div>

              {/* Invite Member (Admin only) */}
              {pool.adminId === user?.id && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Invite New Member</h3>
                  <form onSubmit={handleInviteMember} className="flex space-x-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={inviteMemberMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Invite</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-3">
                {members.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {member.user.firstName?.[0] || member.user.email?.[0] || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {member.user.firstName || member.user.email}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Position {member.position} {member.userId === user?.id && "• You"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.userId === pool.adminId && (
                        <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-1 rounded-full">
                          Admin
                        </span>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(member.joinedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="max-w-4xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              {/* Messages */}
              <div className="p-6 h-96 overflow-y-auto border-b border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message: any) => (
                      <div key={message.id} className="flex space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {message.sender.firstName?.[0] || message.sender.email?.[0] || "U"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {message.sender.firstName || message.sender.email}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !messageText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payments</h2>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Make Payment</span>
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Payment history and options will be displayed here.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}