import { useEffect, useRef, useState } from 'react';
import { Camera, Mail, Phone, MapPin, Calendar, User, Building, GraduationCap, Briefcase, Save, Edit2, Upload, Heart, Sparkles, Shield, Tag, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePageProps {
  userRole: 'seller' | 'student' | 'teacher' | 'school' | 'admin' | 'super-admin' | 'caregiver';
  highContrast: boolean;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

const formatFileName = (name: string, maxLen = 20) => {
  if (!name) return 'image';
  if (name.length <= maxLen) return name;
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  const baseName = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;
  const keep = Math.max(4, maxLen - ext.length - 3);
  const start = Math.ceil(keep / 2);
  const end = Math.floor(keep / 2);
  return `${baseName.substring(0, start)}...${baseName.substring(baseName.length - end)}${ext}`;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 KB';
  return bytes > 1024 * 1024 
    ? (bytes / (1024 * 1024)).toFixed(1) + ' MB' 
    : (bytes / 1024).toFixed(0) + ' KB';
};

// Fallback profile data based on user role
const getProfileDataForRole = (role: string) => {
  switch (role) {
    case 'seller':
      return {
        name: 'Alice Seller',
        email: 'alice.seller@example.com',
        phone: '+254700000001',
        address: '123 Artisan Plaza, Westlands, Nairobi',
        location: 'Nairobi, Kenya',
        joinDate: new Date().toISOString(),
        disabilityId: 'DIS-2024-12345',
        disabilityType: 'Physical / Mobility',
        bio: 'Passionate artisan specializing in handmade pottery, jewelry, and beadwork. Crafting unique pieces that empower our community.',
        skills: ['Pottery', 'Ceramics', 'Beadwork', 'Weaving'],
        hobbies: ['Painting', 'Wood Carving', 'Gardening'],
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aliceseller',
      };
    case 'student':
      return {
        name: 'Emma Johnson',
        email: 'emma.johnson@school.edu',
        phone: '+254700000002',
        address: '456 Vocational Way, Nairobi',
        location: 'Nairobi, Kenya',
        joinDate: new Date().toISOString(),
        school: 'Hope Academy for Special Education',
        teacher: 'Dr. Sarah Williams',
        disabilityId: 'DIS-2024-67890',
        disabilityType: 'Visual / Hearing Support',
        bio: 'Student artisan learning to create beautiful clay sculptures, macrame wall hangings, and handcrafted accessories.',
        skills: ['Sculpture', 'Crafts', 'Drawing', 'Macrame'],
        hobbies: ['Music', 'Sculpting', 'Reading'],
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emmajohnson',
      };
    case 'teacher':
      return {
        name: 'Dr. Sarah Williams',
        email: 'sarah.williams@school.edu',
        phone: '+254700000003',
        address: '789 Academy Road, Nairobi',
        location: 'Nairobi, Kenya',
        joinDate: new Date().toISOString(),
        school: 'Hope Academy for Special Education',
        department: 'Art & Vocational Crafts',
        specialization: 'Vocational Training & Art Therapy',
        students: 8,
        bio: 'Dedicated educator with over 10 years of experience in vocational arts, mentoring students with disabilities to achieve economic independence.',
        skills: ['Mentorship', 'Art Therapy', 'Curriculum Design'],
        hobbies: ['Ceramics', 'Photography', 'Volunteering'],
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarahwilliams',
      };
    case 'school':
      return {
        name: 'Hope Academy for Special Education',
        email: 'admin@hopeacademy.edu',
        phone: '+254700000004',
        address: '1000 Education Boulevard, Nairobi',
        location: 'Nairobi, Kenya',
        joinDate: new Date().toISOString(),
        schoolId: 'SCH-2023-001',
        totalTeachers: 3,
        totalStudents: 26,
        bio: 'A premier vocational institution dedicated to providing quality hands-on education and craft entrepreneurship for students with disabilities.',
        accreditation: 'National Vocational Training Board Certified',
        profilePhoto: 'https://api.dicebear.com/7.x/shapes/svg?seed=hopeacademy',
      };
    default:
      return {
        name: 'User',
        email: 'user@example.com',
        phone: '',
        address: '',
        location: '',
        joinDate: new Date().toISOString(),
        bio: '',
        skills: [],
        hobbies: [],
        profilePhoto: '',
      };
  }
};

export function ProfilePage({ userRole, highContrast }: ProfilePageProps) {
  const { updateUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [hobbiesInput, setHobbiesInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [originalPhoto, setOriginalPhoto] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:5000';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/dashboard/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let profile = null;
        if (res.ok) {
          const data = await res.json();
          profile = data.profile;
        }

        if (!profile) {
          profile = getProfileDataForRole(userRole);
        }

        // Construct full URL for profile photo if it's a relative path
        let photoUrl = profile?.profilePhoto;
        if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
          photoUrl = `${API_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
        }

        setProfileData(profile);
        setFormData(profile);
        setProfilePhoto(photoUrl || '');
        setOriginalPhoto(photoUrl || '');
        setSkillsInput(Array.isArray(profile?.skills) ? profile.skills.join(', ') : (profile?.skills || ''));
        setHobbiesInput(Array.isArray(profile?.hobbies) ? profile.hobbies.join(', ') : (profile?.hobbies || ''));
      } catch (error) {
        console.error('Error loading profile:', error);
        const fallback = getProfileDataForRole(userRole);
        setProfileData(fallback);
        setFormData(fallback);
        setProfilePhoto(fallback?.profilePhoto || '');
        setOriginalPhoto(fallback?.profilePhoto || '');
        setSkillsInput(Array.isArray(fallback?.skills) ? fallback.skills.join(', ') : '');
        setHobbiesInput(Array.isArray(fallback?.hobbies) ? fallback.hobbies.join(', ') : '');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [API_URL, userRole]);

  if (isLoading) {
    return (
      <div className={`flex min-h-[350px] items-center justify-center ${highContrast ? 'bg-black text-white' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading your profile details...</p>
        </div>
      </div>
    );
  }

  if (!profileData || !formData) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP, GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRevertPhoto = () => {
    setProfilePhoto(originalPhoto);
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isEditing) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isEditing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      let uploadedPhoto = formData.profilePhoto;

      // Step 1: Upload photo file if user selected a new file
      if (photoFile) {
        const form = new FormData();
        form.append('files', photoFile);
        const uploadRes = await fetch(`${API_URL}/api/uploads`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: form
        });
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(`Upload failed: ${errorData.error || uploadRes.statusText}`);
        }
        const uploadData = await uploadRes.json();
        const photoUrl = uploadData.files?.[0]?.url || uploadData.url;
        if (photoUrl) {
          uploadedPhoto = photoUrl.startsWith('http') 
            ? photoUrl 
            : `${API_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
        }
      }

      const parsedSkills = skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const parsedHobbies = hobbiesInput
        .split(',')
        .map(h => h.trim())
        .filter(Boolean);

      // Step 2: Save updated fields to database
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        location: formData.location || formData.address,
        bio: formData.bio,
        skills: parsedSkills,
        hobbies: parsedHobbies,
        profilePhoto: uploadedPhoto,
        disabilityId: formData.disabilityId,
        disabilityType: formData.disabilityType,
        businessName: formData.businessName,
        specialization: formData.specialization,
        department: formData.department,
        accreditation: formData.accreditation,
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
        throw new Error(`Profile update failed: ${errorData.error || updateRes.statusText}`);
      }

      const updateResponse = await updateRes.json();
      const savedProfile = updateResponse.profile || {
        ...formData,
        ...payload,
        profilePhoto: uploadedPhoto,
      };

      // Format photo URL for display
      const displayPhoto = savedProfile.profilePhoto?.startsWith('http') || savedProfile.profilePhoto?.startsWith('data:')
        ? savedProfile.profilePhoto
        : `${API_URL}${savedProfile.profilePhoto?.startsWith('/') ? '' : '/'}${savedProfile.profilePhoto}`;

      // Update local state
      setProfileData(savedProfile);
      setFormData(savedProfile);
      setProfilePhoto(displayPhoto || '');
      setOriginalPhoto(displayPhoto || '');
      setSkillsInput(Array.isArray(savedProfile.skills) ? savedProfile.skills.join(', ') : '');
      setHobbiesInput(Array.isArray(savedProfile.hobbies) ? savedProfile.hobbies.join(', ') : '');
      setPhotoFile(null);
      setIsEditing(false);

      // Step 3: Synchronize AuthContext and DashboardHeader in real-time
      updateUser({
        name: savedProfile.name,
        email: savedProfile.email,
        phone: savedProfile.phone,
        profilePhoto: displayPhoto,
        bio: savedProfile.bio,
        location: savedProfile.location,
        address: savedProfile.address,
        skills: savedProfile.skills,
        hobbies: savedProfile.hobbies,
        disabilityId: savedProfile.disabilityId,
        disabilityType: savedProfile.disabilityType,
        businessName: savedProfile.businessName,
      });

      alert('Profile updated and synchronized successfully!');
    } catch (error) {
      console.error('Save profile error:', error);
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'seller':
        return Briefcase;
      case 'student':
        return GraduationCap;
      case 'teacher':
        return GraduationCap;
      case 'school':
        return Building;
      case 'caregiver':
        return Heart;
      case 'admin':
      case 'super-admin':
        return Shield;
      default:
        return User;
    }
  };

  const RoleIcon = getRoleIcon();
  const formattedMemberSince = formatDate(profileData.joinDate);
  const initials = (profileData.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${highContrast ? 'text-white' : 'text-gray-900'}`}>
            Profile
          </h1>
          <p className={`text-sm mt-1 ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your account information, public artisan bio, and personal details
          </p>
        </div>
        {!isEditing ? (
          <Button size="lg" onClick={() => setIsEditing(true)} className="gap-2 shadow-sm">
            <Edit2 className="h-5 w-5" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => { setIsEditing(false); handleRevertPhoto(); }} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="lg" onClick={handleSave} className="gap-2 shadow-sm" disabled={isSaving}>
              <Save className="h-5 w-5" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Photo & Summary Card */}
        <Card className={`lg:col-span-1 ${highContrast ? 'border-2 border-white bg-black' : 'shadow-md border-gray-200'}`}>
          <CardHeader className="border-b pb-4">
            <CardTitle className={`text-lg font-semibold ${highContrast ? 'text-white' : 'text-gray-900'}`}>
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col items-center">
              {/* Large Avatar Container matching Image 2 */}
              <div 
                className={`relative w-44 h-44 rounded-full flex items-center justify-center p-1 transition-all ${
                  isDragging ? 'ring-4 ring-blue-500 scale-105 bg-blue-50' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl ring-4 ring-blue-100/80 bg-gray-100 overflow-hidden flex items-center justify-center relative group">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt={`${profileData.name}'s profile`} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-4xl font-bold">
                      {initials}
                    </div>
                  )}

                  {/* Interactive hover overlay when editing */}
                  {isEditing && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer rounded-full"
                    >
                      <Camera className="h-7 w-7 mb-1" />
                      <span className="text-xs font-medium">Change Photo</span>
                    </div>
                  )}
                </div>

                {/* Circular Blue Camera Action Badge (positioned at bottom-right corner) */}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white hover:bg-blue-700 transition-transform hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
                    aria-label="Upload new photo"
                    title="Click to choose a photo"
                  >
                    <Camera className="h-6 w-6" />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  aria-label="Upload profile photo"
                />
              </div>

              {/* Photo staging preview indicator */}
              {photoFile && (
                <div className="mt-3.5 w-full max-w-[260px] rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 p-2.5 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-700">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                    <span>New Photo Staged</span>
                  </div>
                  
                  <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] text-gray-700 bg-white/90 rounded-md py-1 px-2.5 border border-blue-100 shadow-2xs overflow-hidden">
                    <Camera className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="truncate max-w-[130px] font-medium" title={photoFile.name}>
                      {formatFileName(photoFile.name, 18)}
                    </span>
                    <span className="text-gray-300 shrink-0">•</span>
                    <span className="text-gray-500 font-mono text-[10px] shrink-0 font-medium">
                      {formatFileSize(photoFile.size)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRevertPhoto}
                    className="mt-2 inline-flex items-center justify-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50/80 py-1 px-2.5 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    Revert to Original Photo
                  </button>
                </div>
              )}

              {/* User Name & Role details with comfortable vertical spacing */}
              <div className="text-center mt-4">
                <h3 className={`text-xl font-bold leading-tight ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                  {profileData.name}
                </h3>
                <Badge variant="secondary" className="mt-2.5 gap-1.5 px-3.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                  <RoleIcon className="h-3.5 w-3.5 text-gray-600" />
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('-', ' ')}
                </Badge>
                {profileData.location && (
                  <p className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {profileData.location}
                  </p>
                )}
              </div>

              {/* Upload Button matching Image 2 */}
              {isEditing && (
                <div className="w-full mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full gap-2 h-11 border-gray-300 font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                  >
                    <Upload className="h-4 w-4 text-blue-600" />
                    Upload New Photo
                  </Button>
                  <p className="text-[11px] text-gray-400 text-center mt-1.5">
                    JPG, PNG, WEBP or GIF (Max 5MB)
                  </p>
                </div>
              )}
            </div>

            {/* Member Details */}
            <div className={`space-y-3.5 border-t pt-5 ${highContrast ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <Calendar className={`h-5 w-5 ${highContrast ? 'text-gray-400' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                    Member since
                  </p>
                  <p className={`text-sm font-medium ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                    {formattedMemberSince}
                  </p>
                </div>
              </div>

              {(userRole === 'seller' || userRole === 'student') && (profileData.disabilityId || isEditing) && (
                <div className="flex items-center gap-3">
                  <User className={`h-5 w-5 ${highContrast ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                      Disability ID
                    </p>
                    <p className={`text-sm font-medium ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                      {profileData.disabilityId || 'Not specified'}
                    </p>
                  </div>
                </div>
              )}

              {profileData.disabilityType && (
                <div className="flex items-center gap-3">
                  <Shield className={`h-5 w-5 ${highContrast ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                      Disability Type / Category
                    </p>
                    <p className={`text-sm font-medium ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                      {profileData.disabilityType}
                    </p>
                  </div>
                </div>
              )}

              {userRole === 'teacher' && 'students' in profileData && (
                <div className="flex items-center gap-3">
                  <GraduationCap className={`h-5 w-5 ${highContrast ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total Students
                    </p>
                    <p className={`text-sm font-medium ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                      {profileData.students}
                    </p>
                  </div>
                </div>
              )}

              {userRole === 'school' && 'totalTeachers' in profileData && (
                <>
                  <div className="flex items-center gap-3">
                    <GraduationCap className={`h-5 w-5 ${highContrast ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                        Total Teachers
                      </p>
                      <p className={`text-sm font-medium ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                        {profileData.totalTeachers}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className={`h-5 w-5 ${highContrast ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                        Total Students
                      </p>
                      <p className={`text-sm font-medium ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                        {profileData.totalStudents}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Tabs */}
        <Card className={`lg:col-span-2 ${highContrast ? 'border-2 border-white bg-black' : 'shadow-md border-gray-200'}`}>
          <CardHeader className="border-b pb-4">
            <CardTitle className={`text-lg ${highContrast ? 'text-white' : 'text-gray-900'}`}>
              Account Information
            </CardTitle>
            <CardDescription className={highContrast ? 'text-gray-300' : 'text-gray-500'}>
              Update your personal details, contact information, artisan bio, and craft specialties
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="personal" className="text-sm font-medium">Personal Info</TabsTrigger>
                <TabsTrigger value="additional" className="text-sm font-medium">Additional Details</TabsTrigger>
              </TabsList>

              {/* Personal Info Tab */}
              <TabsContent value="personal" className="space-y-6 pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                      Full Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        className={`pl-10 h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                        placeholder="e.g., Alice Seller Maringo"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className={`pl-10 h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        className={`pl-10 h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                        placeholder="+254 700 000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="joinDate" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                      Join Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="joinDate"
                        value={formattedMemberSince}
                        disabled
                        className="pl-10 h-12 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                      Location / City
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="location"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        disabled={!isEditing}
                        className={`pl-10 h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                        placeholder="e.g. Nairobi, Kenya"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                      Physical Address
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="address"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        disabled={!isEditing}
                        className={`pl-10 h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                        placeholder="Street address or workshop location"
                      />
                    </div>
                  </div>

                  {(userRole === 'seller' || userRole === 'student') && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="disabilityId" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                          Disability ID / National Registration
                        </Label>
                        <Input
                          id="disabilityId"
                          value={formData.disabilityId || ''}
                          onChange={(e) => setFormData({ ...formData, disabilityId: e.target.value })}
                          disabled={!isEditing}
                          className={`h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                          placeholder="e.g., DIS-2024-12345"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="disabilityType" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                          Disability Type / Accessibility Support
                        </Label>
                        <Input
                          id="disabilityType"
                          value={formData.disabilityType || ''}
                          onChange={(e) => setFormData({ ...formData, disabilityType: e.target.value })}
                          disabled={!isEditing}
                          className={`h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                          placeholder="e.g. Physical, Hearing, Visual support"
                        />
                      </div>
                    </>
                  )}

                  {userRole === 'seller' && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="businessName" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                        Business / Store Name
                      </Label>
                      <Input
                        id="businessName"
                        value={formData.businessName || ''}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        disabled={!isEditing}
                        className={`h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                        placeholder="e.g., Alice Handicrafts & Crafts Shop"
                      />
                    </div>
                  )}

                  {userRole === 'student' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="school" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                          Associated School
                        </Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="school"
                            value={formData.school || ''}
                            disabled
                            className="pl-10 h-12 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teacher" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                          Assigned Teacher
                        </Label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="teacher"
                            value={formData.teacher || ''}
                            disabled
                            className="pl-10 h-12 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {userRole === 'teacher' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="school" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                          School Name
                        </Label>
                        <Input
                          id="school"
                          value={formData.school || ''}
                          disabled
                          className="h-12 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                          Department
                        </Label>
                        <Input
                          id="department"
                          value={formData.department || ''}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          disabled={!isEditing}
                          className={`h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                          placeholder="e.g. Art & Vocational Crafts"
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Additional Details Tab */}
              <TabsContent value="additional" className="space-y-6 pt-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="bio" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bio & Artisan Story
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={4}
                      className={`resize-none leading-relaxed ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                      placeholder="Share your story, passion, craft journey, and what inspires your creative handmade products..."
                    />
                    <p className="text-xs text-gray-500">
                      Your story is featured on your seller profile to help buyers connect with your creations.
                    </p>
                  </div>

                  {/* Skills & Crafts */}
                  <div className="space-y-2">
                    <Label htmlFor="skills" className={`text-sm font-medium flex items-center gap-1.5 ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Skills & Specialties (Separated by commas)
                    </Label>
                    {isEditing ? (
                      <Input
                        id="skills"
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        placeholder="e.g., Beadwork, Pottery, Basket Weaving, Leatherwork"
                        className="h-12 bg-white"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(profileData.skills || []).length > 0 ? (
                          profileData.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary" className="px-3.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400 italic">No skills listed yet. Click "Edit Profile" to add.</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hobbies & Creative Interests */}
                  <div className="space-y-2">
                    <Label htmlFor="hobbies" className={`text-sm font-medium flex items-center gap-1.5 ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Heart className="h-4 w-4 text-pink-500" />
                      Hobbies & Creative Interests (Separated by commas)
                    </Label>
                    {isEditing ? (
                      <Input
                        id="hobbies"
                        value={hobbiesInput}
                        onChange={(e) => setHobbiesInput(e.target.value)}
                        placeholder="e.g., Wood Carving, Painting, Music, Gardening, Storytelling"
                        className="h-12 bg-white"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(profileData.hobbies || []).length > 0 ? (
                          profileData.hobbies.map((hobby: string, index: number) => (
                            <Badge key={index} variant="secondary" className="px-3.5 py-1.5 text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200">
                              {hobby}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400 italic">No hobbies listed yet. Click "Edit Profile" to add.</span>
                        )}
                      </div>
                    )}
                  </div>

                  {userRole === 'teacher' && (
                    <div className="space-y-2">
                      <Label htmlFor="specialization" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                        Specialization & Subjects Taught
                      </Label>
                      <Input
                        id="specialization"
                        value={formData.specialization || ''}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        disabled={!isEditing}
                        className={`h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                        placeholder="e.g., Art Therapy, Special Needs Vocational Training"
                      />
                    </div>
                  )}

                  {userRole === 'school' && (
                    <div className="space-y-2">
                      <Label htmlFor="accreditation" className={`text-sm font-medium ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
                        Accreditation & Certifications
                      </Label>
                      <Input
                        id="accreditation"
                        value={formData.accreditation || ''}
                        onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
                        disabled={!isEditing}
                        className={`h-12 ${!isEditing ? 'bg-gray-50/70 text-gray-800' : 'bg-white'}`}
                        placeholder="e.g., National Vocational Training Board Certified"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
