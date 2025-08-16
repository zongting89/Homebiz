import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { MapPin, Store, CreditCard, Users, Search, Plus } from 'lucide-react';
import './App.css';

// Set up axios base URL
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
axios.defaults.baseURL = API_BASE;

// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    
    return userData;
  };

  const register = async (email, password, name, role) => {
    const response = await axios.post('/api/auth/register', { email, password, name, role });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = React.useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Store className="w-8 h-8 text-emerald-600" />
              <span className="text-xl font-bold text-gray-900">HomeBiz SG</span>
            </Link>
            
            <div className="flex space-x-6">
              <Link to="/discover" className="text-gray-700 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Discover
              </Link>
              {user && user.role === 'seller' && (
                <>
                  <Link to="/dashboard" className="text-gray-700 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/subscription" className="text-gray-700 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Subscription
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700">Welcome, {user.name}</span>
                <Badge variant={user.role === 'seller' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
                <Button variant="outline" onClick={logout} size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <div className="space-x-2">
                <Button variant="outline" onClick={() => navigate('/login')} size="sm">
                  Login
                </Button>
                <Button onClick={() => navigate('/register')} size="sm">
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Home Component
const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                Discover Amazing
                <span className="text-emerald-600 block">Home Businesses</span>
                in Singapore
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Connect with local entrepreneurs and discover unique products and services 
                right in your neighborhood. Support Singapore's thriving home business community.
              </p>
              <div className="flex space-x-4">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  <Search className="w-5 h-5 mr-2" />
                  Explore Businesses
                </Button>
                <Button variant="outline" size="lg">
                  <Store className="w-5 h-5 mr-2" />
                  List Your Business
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxzbWFsbCUyMGJ1c2luZXNzfGVufDB8fHx8MTc1NTM1ODk2M3ww&ixlib=rb-4.1.0&q=85"
                alt="Local Business"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">500+ Businesses</p>
                    <p className="text-sm text-gray-600">Already registered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose HomeBiz SG?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We make it easy to discover and connect with home-based businesses in Singapore
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Location-Based Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Find businesses near you or in any specific area in Singapore with our 
                  interactive map feature.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Make secure credit card payments directly through our platform. 
                  Quick, safe, and reliable transactions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Store className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Business Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Easy business registration for home entrepreneurs. Showcase your 
                  products and services to thousands of customers.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join our community of local businesses and customers today
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" variant="secondary">
              Browse Businesses
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-emerald-600">
              Register Your Business
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

// Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/discover');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>Access your HomeBiz SG account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-emerald-600 hover:text-emerald-500">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Register Component
const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'buyer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(formData.email, formData.password, formData.name, formData.role);
      if (formData.role === 'seller') {
        navigate('/subscription');
      } else {
        navigate('/discover');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Join the HomeBiz SG community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">I want to:</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="buyer"
                      checked={formData.role === 'buyer'}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="text-emerald-600"
                    />
                    <span className="text-sm">Browse & Buy</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="seller"
                      checked={formData.role === 'seller'}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="text-emerald-600"
                    />
                    <span className="text-sm">Sell Products/Services</span>
                  </label>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 hover:text-emerald-500">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Subscription Component
const Subscription = () => {
  const [packages, setPackages] = useState({});
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
    fetchCurrentSubscription();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get('/api/subscription/packages');
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await axios.get('/api/subscription/current');
      setCurrentSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (packageId) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/subscription/checkout', {
        package_id: packageId,
        origin_url: window.location.origin
      });
      
      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      setLoading(false);
    }
  };

  if (user && user.role !== 'seller') {
    return <Navigate to="/discover" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Subscription Plan
          </h1>
          <p className="text-xl text-gray-600">
            Subscribe to list your business and start selling on HomeBiz SG
          </p>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && currentSubscription.has_subscription && (
          <Card className="mb-8 border-emerald-200 bg-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-emerald-800">Current Subscription</h3>
                  <p className="text-emerald-600">
                    {currentSubscription.is_active ? 'Active' : 'Inactive'} • 
                    Expires: {new Date(currentSubscription.expires_at).toLocaleDateString()}
                  </p>
                </div>
                {currentSubscription.is_active && (
                  <Button onClick={() => navigate('/dashboard')} variant="outline">
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Packages */}
        <div className="grid md:grid-cols-2 gap-8">
          {Object.entries(packages).map(([packageId, pkg]) => (
            <Card key={packageId} className="relative border-2 hover:border-emerald-300 transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <div className="text-3xl font-bold text-emerald-600">
                  S${pkg.price}
                  <span className="text-lg font-normal text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>List your home business</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Unlimited products/services</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Customer payment processing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Location-based discovery</span>
                  </div>
                  {packageId === 'premium' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Priority listing</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Analytics dashboard</span>
                      </div>
                    </>
                  )}
                </div>
                
                <Button 
                  onClick={() => handleSubscribe(packageId)}
                  disabled={loading}
                  className="w-full"
                  variant={packageId === 'premium' ? 'default' : 'outline'}
                >
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Google Maps Component
const BusinessMap = ({ businesses, center = { lat: 1.3521, lng: 103.8198 } }) => {
  const { isLoaded } = window.google ? { isLoaded: true } : require('@react-google-maps/api').useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
  });

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
  };

  const defaultOptions = {
    zoom: 11,
    center,
    disableDefaultUI: false,
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  const GoogleMap = require('@react-google-maps/api').GoogleMap;
  const Marker = require('@react-google-maps/api').Marker;
  const InfoWindow = require('@react-google-maps/api').InfoWindow;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={11}
      options={defaultOptions}
    >
      {businesses.map((business) => (
        <Marker
          key={business.business_id}
          position={{ lat: business.latitude, lng: business.longitude }}
          title={business.name}
        />
      ))}
    </GoogleMap>
  );
};

// Discover Component  
const Discover = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [searchArea, setSearchArea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchBusinesses();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable');
          // Default to Singapore center
          setUserLocation({ lat: 1.3521, lng: 103.8198 });
        }
      );
    } else {
      setUserLocation({ lat: 1.3521, lng: 103.8198 });
    }
  };

  const fetchBusinesses = async () => {
    try {
      const params = {};
      if (userLocation) {
        params.latitude = userLocation.lat;
        params.longitude = userLocation.lng;
      }
      
      const response = await axios.get('/api/businesses', { params });
      setBusinesses(response.data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesCategory = !selectedCategory || business.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesArea = !searchArea || business.address.toLowerCase().includes(searchArea.toLowerCase());
    return matchesCategory && matchesArea;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Discovering amazing businesses near you...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Local Businesses
          </h1>
          <p className="text-xl text-gray-600">
            Find amazing home-based businesses near you in Singapore
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 bg-white rounded-xl shadow-md p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchArea">Search by Area</Label>
              <Input
                id="searchArea"
                placeholder="e.g., Orchard, Tampines, Jurong..."
                value={searchArea}
                onChange={(e) => setSearchArea(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Food, Beauty, Services..."
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Map View */}
        {userLocation && filteredBusinesses.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Business Locations</span>
              </CardTitle>
              <CardDescription>Interactive map showing business locations in Singapore</CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessMap businesses={filteredBusinesses} center={userLocation} />
            </CardContent>
          </Card>
        )}

        {/* Business Results */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'Business' : 'Businesses'} Found
          </h2>
          {filteredBusinesses.length > 0 && (
            <div className="text-sm text-gray-600">
              {searchArea && `in ${searchArea} • `}
              {selectedCategory && `${selectedCategory} category`}
            </div>
          )}
        </div>

        {filteredBusinesses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {businesses.length === 0 ? 'No businesses yet' : 'No businesses match your search'}
              </h3>
              <p className="text-gray-600">
                {businesses.length === 0 
                  ? 'Be the first to register your business!' 
                  : 'Try adjusting your search criteria or explore other areas.'}
              </p>
              {(searchArea || selectedCategory) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchArea('');
                    setSelectedCategory('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <Card key={business.business_id} className="hover:shadow-lg transition-shadow card-depth">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Store className="w-5 h-5 text-emerald-600" />
                        <span>{business.name}</span>
                      </CardTitle>
                      <Badge variant="secondary" className="mt-2">{business.category}</Badge>
                    </div>
                    {business.distance && (
                      <Badge variant="outline" className="text-xs">
                        {business.distance} km away
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-2">{business.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{business.address}</span>
                    </div>
                    
                    {business.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="w-4 h-4 flex items-center justify-center">📞</span>
                        <span>{business.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button variant="outline" size="sm" className="w-full">
                      <Store className="w-4 h-4 mr-2" />
                      View Products & Services
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Dashboard Component for Sellers
const Dashboard = () => {
  const [businesses, setBusinesses] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'seller') {
      fetchMyBusinesses();
      fetchSubscription();
    }
  }, [user]);

  const fetchMyBusinesses = async () => {
    try {
      const response = await axios.get('/api/businesses/my');
      setBusinesses(response.data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await axios.get('/api/subscription/current');
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role !== 'seller') {
    return <Navigate to="/discover" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveSubscription = subscription && subscription.has_subscription && subscription.is_active;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Manage your business listings and track your performance</p>
        </div>

        {/* Subscription Status */}
        <Card className={`mb-8 ${hasActiveSubscription ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasActiveSubscription ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                  {hasActiveSubscription ? (
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className={`font-semibold ${hasActiveSubscription ? 'text-emerald-800' : 'text-orange-800'}`}>
                    {hasActiveSubscription ? 'Active Subscription' : 'Subscription Required'}
                  </h3>
                  <p className={`text-sm ${hasActiveSubscription ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {hasActiveSubscription 
                      ? `Expires: ${new Date(subscription.expires_at).toLocaleDateString()}`
                      : 'Subscribe to start listing your business'}
                  </p>
                </div>
              </div>
              {!hasActiveSubscription && (
                <Button onClick={() => navigate('/subscription')}>
                  Subscribe Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {hasActiveSubscription && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Businesses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{businesses.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {businesses.filter(b => b.status === 'active').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500 mt-1">Add products to your businesses</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Business Listings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Business Listings</CardTitle>
                <CardDescription>Manage your registered businesses</CardDescription>
              </div>
              {hasActiveSubscription && (
                <Button onClick={() => navigate('/create-business')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Business
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!hasActiveSubscription ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Required</h3>
                <p className="text-gray-600 mb-6">
                  You need an active subscription to list your businesses on HomeBiz SG
                </p>
                <Button onClick={() => navigate('/subscription')}>
                  View Subscription Plans
                </Button>
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses yet</h3>
                <p className="text-gray-600 mb-6">
                  Start by adding your first business listing
                </p>
                <Button onClick={() => navigate('/create-business')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Business
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {businesses.map((business) => (
                  <div key={business.business_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Store className="w-5 h-5 text-emerald-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{business.name}</h4>
                            <p className="text-sm text-gray-600">{business.category}</p>
                          </div>
                        </div>
                        <p className="text-gray-600 mt-2 line-clamp-2">{business.description}</p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{business.address}</span>
                          </div>
                          <Badge 
                            variant={business.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {business.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Products
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Subscription Status Check Component
const SubscriptionStatusCheck = () => {
  const location = useLocation();
  const [sessionId, setSessionId] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const session = urlParams.get('session_id');
    
    if (session) {
      setSessionId(session);
      checkPaymentStatus(session);
    }
  }, [location]);

  const checkPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    
    if (attempts >= maxAttempts) {
      setPaymentResult({
        success: false,
        message: 'Payment verification timed out. Please check your account.'
      });
      setCheckingPayment(false);
      return;
    }

    setCheckingPayment(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const response = await axios.get(`/api/subscription/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setPaymentResult({
          success: true,
          message: 'Payment successful! Your subscription is now active.'
        });
        setCheckingPayment(false);
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      } else if (response.data.status === 'expired') {
        setPaymentResult({
          success: false,
          message: 'Payment session expired. Please try again.'
        });
        setCheckingPayment(false);
      } else {
        // Continue polling
        setTimeout(() => checkPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch (error) {
      setPaymentResult({
        success: false,
        message: 'Error checking payment status. Please contact support.'
      });
      setCheckingPayment(false);
    }
  };

  if (!sessionId) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-8">
          {checkingPayment ? (
            <>
              <div className="spinner mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Processing Your Payment
              </h3>
              <p className="text-gray-600">
                Please wait while we verify your subscription payment...
              </p>
            </>
          ) : paymentResult ? (
            <>
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                paymentResult.success ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                {paymentResult.success ? (
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✗</span>
                  </div>
                )}
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${
                paymentResult.success ? 'text-emerald-900' : 'text-red-900'
              }`}>
                {paymentResult.success ? 'Payment Successful!' : 'Payment Failed'}
              </h3>
              <p className={`${
                paymentResult.success ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {paymentResult.message}
              </p>
              {paymentResult.success && (
                <p className="text-sm text-gray-500 mt-4">
                  Redirecting to dashboard in 3 seconds...
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/discover" />;
  }

  return children;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/discover" element={<Discover />} />
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <Subscription />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscription/success" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SubscriptionStatusCheck />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscription/cancel" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <Subscription />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;