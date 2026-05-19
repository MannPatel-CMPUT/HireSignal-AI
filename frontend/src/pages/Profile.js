import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { User, Mail, Calendar, Shield } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1
          className="text-4xl font-bold tracking-tight mb-8"
          style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          data-testid="profile-title"
        >
          Profile
        </h1>

        <div className="bg-white border border-zinc-200 rounded-xl p-8" data-testid="profile-card">
          <div className="flex items-center gap-6 mb-8">
            <div className="h-20 w-20 bg-zinc-900 text-white rounded-full flex items-center justify-center text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                {user.name}
              </h2>
              <p className="text-zinc-600">{user.email}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Name</p>
                <p className="font-semibold" data-testid="profile-name">{user.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Email</p>
                <p className="font-semibold" data-testid="profile-email">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Member Since</p>
                <p className="font-semibold" data-testid="profile-created-at">
                  {format(new Date(user.created_at), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Role</p>
                <p className="font-semibold capitalize" data-testid="profile-role">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;