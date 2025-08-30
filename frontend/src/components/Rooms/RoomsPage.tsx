import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import apiService from '../../services/api';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Badge,
  Divider
} from '@mui/material';
import {
  Chat,
  Groups,
  Security,
  Shield,
  Lock,
  Public,
  Visibility,
  PersonAdd,
  ArrowBack,
  Refresh,
  Info,
  SentimentSatisfied,
  Warning,
  Check
} from '@mui/icons-material';

interface Room {
  id: string;
  name: string;
  description: string;
  icon: string;
  userCount: number;
  maxParticipants: number;
  roomType: 'public' | 'private';
  isActive: boolean;
  lastActivity: string;
  securityLevel: 'high' | 'medium' | 'standard';
  tags: string[];
}

const RoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // Redirect to register if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
  }, [isAuthenticated, navigate]);


  const mockRooms: Room[] = [
    {
      id: '1',
      name: 'General Lounge',
      description: 'Open discussion for everyone. Share your thoughts, experiences, and connect with people from around the world.',
      icon: '💬',
      userCount: 87,
      maxParticipants: 200,
      roomType: 'public',
      isActive: true,
      lastActivity: '2 minutes ago',
      securityLevel: 'high',
      tags: ['general', 'friendly', 'active']
    },
    {
      id: '2',
      name: 'Gaming Hub',
      description: 'Discuss your favorite games, find gaming partners, share tips and tricks.',
      icon: '🎮',
      userCount: 52,
      maxParticipants: 150,
      roomType: 'public',
      isActive: true,
      lastActivity: '1 minute ago',
      securityLevel: 'high',
      tags: ['gaming', 'entertainment', 'competitive']
    },
    {
      id: '3',
      name: 'Music Corner',
      description: 'Share and discover new music, discuss artists, albums, and concerts.',
      icon: '🎵',
      userCount: 34,
      maxParticipants: 100,
      roomType: 'public',
      isActive: true,
      lastActivity: '5 minutes ago',
      securityLevel: 'medium',
      tags: ['music', 'discovery', 'creative']
    },
    {
      id: '4',
      name: 'Movie Talk',
      description: 'Chat about movies, TV shows, reviews, and recommendations.',
      icon: '🎬',
      userCount: 29,
      maxParticipants: 100,
      roomType: 'public',
      isActive: true,
      lastActivity: '8 minutes ago',
      securityLevel: 'medium',
      tags: ['movies', 'entertainment', 'reviews']
    },
    {
      id: '5',
      name: 'Tech Discussion',
      description: 'Technology talks, programming discussions, and innovation sharing.',
      icon: '💻',
      userCount: 41,
      maxParticipants: 120,
      roomType: 'public',
      isActive: true,
      lastActivity: '3 minutes ago',
      securityLevel: 'high',
      tags: ['technology', 'programming', 'innovation']
    },
    {
      id: '6',
      name: 'Random Thoughts',
      description: 'Share your random ideas, philosophical thoughts, and deep conversations.',
      icon: '💭',
      userCount: 63,
      maxParticipants: 150,
      roomType: 'public',
      isActive: true,
      lastActivity: '1 minute ago',
      securityLevel: 'standard',
      tags: ['philosophy', 'thoughts', 'deep']
    },
    {
      id: '7',
      name: 'Study Group',
      description: 'Academic discussions, homework help, and learning together.',
      icon: '📚',
      userCount: 18,
      maxParticipants: 80,
      roomType: 'public',
      isActive: true,
      lastActivity: '12 minutes ago',
      securityLevel: 'high',
      tags: ['education', 'study', 'academic']
    },
    {
      id: '8',
      name: 'Art Gallery',
      description: 'Share artwork, get feedback, discuss artistic techniques and inspiration.',
      icon: '🎨',
      userCount: 25,
      maxParticipants: 75,
      roomType: 'public',
      isActive: true,
      lastActivity: '6 minutes ago',
      securityLevel: 'medium',
      tags: ['art', 'creative', 'visual']
    }
  ];

  useEffect(() => {
    const loadRooms = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      try {
        // Load real rooms from API
        const response = await fetch('http://localhost:8000/api/v1/chat/public-rooms', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (response.ok) {
          const realRooms = await response.json();
          console.log('Loaded real rooms from API:', realRooms);
          
          // If API returns rooms, use them; otherwise use mock rooms
          if (realRooms && realRooms.length > 0) {
            // Convert API response to Room interface format
            const formattedRooms = realRooms.map((room: any) => ({
              id: room.id,
              name: room.name,
              description: room.description,
              icon: '💬', // Default icon
              userCount: room.userCount || 0,
              maxParticipants: room.maxParticipants,
              roomType: room.roomType,
              isActive: room.isActive,
              lastActivity: room.lastActivity || 'Recently active',
              securityLevel: room.securityLevel || 'medium',
              tags: room.tags || ['public']
            }));
            setRooms(formattedRooms);
          } else {
            console.log('No real rooms found, using mock data');
            setRooms(mockRooms);
          }
        } else {
          console.error('Failed to load rooms from API, using mock data');
          setRooms(mockRooms);
        }
      } catch (error) {
        console.error('Failed to load rooms:', error);
        setRooms(mockRooms);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [isAuthenticated]);

  const handleJoinRoom = async (roomId: string) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    setSelectedRoom(roomId);
    try {
      // Join the room via API (if backend supports it)
      // For now, just navigate to chat
      navigate(`/chat/${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      setSelectedRoom(null);
    }
  };

  const handleRefresh = async () => {
    setRooms([]);
    setLoading(true);
    try {
      // Simulate refresh delay
      setTimeout(() => {
        setRooms(mockRooms);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to refresh rooms:', error);
      setRooms(mockRooms);
      setLoading(false);
    }
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      default: return 'info';
    }
  };

  const getSecurityIcon = (level: string) => {
    switch (level) {
      case 'high': return <Shield />;
      case 'medium': return <Security />;
      default: return <Lock />;
    }
  };

  const getOccupancyColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 80) return 'error';
    if (percentage >= 60) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}
      >
        <Stack alignItems="center" spacing={3}>
          <CircularProgress size={60} sx={{ color: 'white' }} />
          <Typography variant="h6">Loading available chat rooms...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}
    >
      {/* Header */}
      <Container maxWidth="lg" sx={{ pt: 4, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <IconButton
            onClick={() => navigate('/')}
            sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" sx={{ flexGrow: 1 }}>
            🏠 Choose Your Chat Room
          </Typography>
          <Tooltip title="Refresh rooms">
            <IconButton
              onClick={handleRefresh}
              sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>

        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, textAlign: 'center' }}>
          Select a room that matches your interests. All conversations are anonymous and secure.
        </Typography>

        {/* Security Notice */}
        <Alert
          severity="info"
          sx={{
            mb: 4,
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
          icon={<Info />}
        >
          <Typography variant="body2">
            <strong>Privacy & Security:</strong> All rooms are monitored by automated moderation systems. 
            Messages are automatically deleted after 24 hours. Your identity remains completely anonymous.
          </Typography>
        </Alert>

        {/* Rooms Grid */}
        <Grid container spacing={3}>
          {rooms.map((room) => (
            <Grid item xs={12} sm={6} lg={4} key={room.id}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.4)'
                  }
                }}
              >
                <CardContent sx={{ p: 3, color: 'white', height: 'calc(100% - 76px)' }}>
                  {/* Room Header */}
                  <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                    <Typography variant="h4">{room.icon}</Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {room.name}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                        <Badge
                          badgeContent={room.userCount}
                          color={getOccupancyColor(room.userCount, room.maxParticipants)}
                        >
                          <Groups sx={{ fontSize: 18, opacity: 0.8 }} />
                        </Badge>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {room.userCount}/{room.maxParticipants}
                        </Typography>
                      </Stack>
                    </Box>
                    <Tooltip title={`${room.securityLevel} security`}>
                      <Chip
                        icon={getSecurityIcon(room.securityLevel)}
                        label={room.securityLevel}
                        size="small"
                        color={getSecurityColor(room.securityLevel)}
                        variant="outlined"
                        sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderColor: 'rgba(255,255,255,0.3)'
                        }}
                      />
                    </Tooltip>
                  </Stack>

                  {/* Room Description */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 2, 
                      opacity: 0.9, 
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                      overflow: 'hidden'
                    }}
                  >
                    {room.description}
                  </Typography>

                  {/* Room Tags */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                    {room.tags.slice(0, 3).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 24
                        }}
                      />
                    ))}
                  </Stack>

                  <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.2)', mb: 2 }} />

                  {/* Room Status */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Check sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Active {room.lastActivity}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Public sx={{ fontSize: 16, opacity: 0.6 }} />
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {room.roomType}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={selectedRoom === room.id}
                    startIcon={selectedRoom === room.id ? <CircularProgress size={16} /> : <PersonAdd />}
                    sx={{
                      py: 1.5,
                      background: selectedRoom === room.id 
                        ? 'rgba(255,255,255,0.2)' 
                        : 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                      '&:hover': {
                        background: selectedRoom === room.id 
                          ? 'rgba(255,255,255,0.2)' 
                          : 'linear-gradient(45deg, #FF5252, #26C6DA)',
                        transform: selectedRoom === room.id ? 'none' : 'translateY(-2px)'
                      },
                      '&:disabled': {
                        color: 'white',
                        opacity: 0.7
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {selectedRoom === room.id ? 'Joining...' : 'Join Room'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Security Features */}
        <Paper
          sx={{
            mt: 6,
            p: 4,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 3,
            color: 'white'
          }}
        >
          <Typography variant="h5" textAlign="center" mb={3} fontWeight="bold">
            🔒 Security & Privacy Features
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Stack alignItems="center" textAlign="center" spacing={1}>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <Shield />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">Real-time Moderation</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  AI-powered content filtering and human moderation ensure safe conversations
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack alignItems="center" textAlign="center" spacing={1}>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <Security />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">Anonymous Identity</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Your real identity is never revealed. Only temporary session-based nicknames
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack alignItems="center" textAlign="center" spacing={1}>
                <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                  <Lock />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">Auto-Delete Messages</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  All messages automatically deleted after 24 hours for complete privacy
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Footer Note */}
        <Box textAlign="center" mt={4}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            By joining a room, you agree to follow our community guidelines and respect other users' privacy
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default RoomsPage;