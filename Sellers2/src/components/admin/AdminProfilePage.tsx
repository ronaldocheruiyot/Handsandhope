import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mail, Phone, MapPin, Calendar, User, Shield, Save, Edit2, Upload, Sparkles, Building, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

export function AdminProfilePage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState<any>({
    name: user?.name || 'Administrator',
    email: user?.email || 'admin@handsandhope.org',
    phone: user?.phone || '',
    address: user?.address || '',
    location: user?.location || '',
    bio: user?.bio || 'System Administrator at Hands & Hope platform.',
    profilePhoto: user?.profilePhoto || '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:5000';

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_URL}/api/dashboard/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setFormData(data.profile);
          }
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err);
      }
    };
    fetchAdminProfile();
  }, [API_URL]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev: any) => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      let uploadedPhoto = formData.profilePhoto;

      if (photoFile) {
        const form = new FormData();
        form.append('files', photoFile);
        const uploadRes = await fetch(`${API_URL}/api/uploads`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          const photoUrl = uploadData.files?.[0]?.url || uploadData.url;
          if (photoUrl) {
            uploadedPhoto = photoUrl.startsWith('http') 
              ? photoUrl 
              : `${API_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
          }
        }
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        location: formData.location || formData.address,
        bio: formData.bio,
        profilePhoto: uploadedPhoto,
      };

      const updateRes = await fetch(`${API_URL}/api/dashboard/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updateResponse = await updateRes.json();
      const savedProfile = updateResponse.profile || { ...formData, ...payload, profilePhoto: uploadedPhoto };

      setFormData(savedProfile);
      setPhotoFile(null);
      setIsEditing(false);

      updateUser({
        name: savedProfile.name,
        email: savedProfile.email,
        phone: savedProfile.phone,
        profilePhoto: uploadedPhoto,
        bio: savedProfile.bio,
        location: savedProfile.location,
        address: savedProfile.address,
      });

      alert('Admin profile updated successfully!');
    } catch (err: any) {
      console.error('Save admin profile error:', err);
      alert(`Error saving profile: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (formData.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Administrator Profile</h1>
          <p className="text-gray-400 mt-1">Manage your administrative credentials and personal details</p>
        </div>
        {!isEditing ? (
          <Button size="lg" onClick={() => setIsEditing(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setIsEditing(false)} disabled={isSaving} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button size="lg" onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo Card */}
        <Card className="bg-gray-800 border-gray-700 lg:col-span-1">
          <CardHeader className="border-b border-gray-700 pb-4">
            <CardTitle className="text-white text-lg">Admin Avatar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 text-center">
            <div className="relative mx-auto w-40 h-40">
              <div className="w-40 h-40 rounded-full border-4 border-gray-700 shadow-2xl ring-4 ring-blue-500/20 bg-gray-900 overflow-hidden flex items-center justify-center">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-4xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg ring-4 ring-gray-800 transition-transform hover:scale-110 cursor-pointer"
                  title="Choose photo"
                >
                  <Camera className="h-5 w-5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">{formData.name}</h3>
              <Badge className="mt-2 bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1.5 px-3 py-1">
                <Shield className="h-3.5 w-3.5" />
                {user?.role === 'super-admin' ? 'Super Administrator' : 'Administrator'}
              </Badge>
              {formData.location && (
                <p className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-2">
                  <MapPin className="h-3.5 w-3.5 text-gray-500" />
                  {formData.location}
                </p>
              )}
            </div>

            {isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2 text-xs border-gray-600 text-gray-300"
              >
                <Upload className="h-4 w-4" />
                Upload New Image
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
          <CardHeader className="border-b border-gray-700 pb-4">
            <CardTitle className="text-white text-lg">Account Details</CardTitle>
            <CardDescription className="text-gray-400">Update your name, contact phone, and administrative bio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9 h-11 bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9 h-11 bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9 h-11 bg-gray-900 border-gray-700 text-white"
                    placeholder="+254 700 000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Location / Headquarters</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9 h-11 bg-gray-900 border-gray-700 text-white"
                    placeholder="e.g. Nairobi, Kenya"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Administrative Bio / Role Overview</Label>
              <Textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                rows={4}
                className="bg-gray-900 border-gray-700 text-white resize-none"
                placeholder="Describe your role and administrative responsibilities..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
