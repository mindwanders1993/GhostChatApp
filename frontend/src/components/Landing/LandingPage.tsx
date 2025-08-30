import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Avatar,
  Stack
} from '@mui/material';
import {
  Chat,
  Security,
  Groups,
  Visibility,
  Shield,
  Lock,
  Public,
  Person,
  Image,
  AudioFile,
  Link,
  Tag,
  ArrowForward,
  Check,
  Warning,
  Info,
  Star
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleEnterChat = () => {
    navigate('/register');
  };

  const features = [
    {
      icon: <Security color="primary" />,
      title: "Complete Anonymity",
      description: "Chat without revealing your identity. No registration required, no personal data stored."
    },
    {
      icon: <Groups color="primary" />,
      title: "Multiple Chat Rooms", 
      description: "Join various themed rooms like Lounge, Gaming, Movies, Music, and more based on your interests."
    },
    {
      icon: <Lock color="primary" />,
      title: "Private Messaging",
      description: "Send direct messages to other users while maintaining complete privacy and anonymity."
    },
    {
      icon: <Image color="primary" />,
      title: "Rich Media Support",
      description: "Share images, GIFs, audio messages, and links to express yourself better."
    },
    {
      icon: <Tag color="primary" />,
      title: "User Tagging",
      description: "Tag other users in public rooms to direct messages and start conversations."
    },
    {
      icon: <Shield color="primary" />,
      title: "Safe Environment",
      description: "Automated moderation and reporting system to maintain a respectful chat environment."
    }
  ];

  const rooms = [
    { name: "General Lounge", description: "Open discussion for everyone", users: "50-100", icon: "💬" },
    { name: "Gaming Hub", description: "Discuss your favorite games", users: "30-80", icon: "🎮" },
    { name: "Music Corner", description: "Share and discover new music", users: "20-60", icon: "🎵" },
    { name: "Movie Talk", description: "Chat about movies and TV shows", users: "15-40", icon: "🎬" },
    { name: "Tech Discussion", description: "Technology and programming chat", users: "25-70", icon: "💻" },
    { name: "Random Thoughts", description: "Share your random ideas", users: "40-90", icon: "💭" }
  ];

  const rules = [
    "Be respectful to all users - no harassment, bullying, or hate speech",
    "No sharing of personal information (real names, addresses, phone numbers)",
    "No explicit, adult, or inappropriate content",
    "No spam, advertising, or promotional content",
    "Use appropriate language - excessive profanity is not allowed",
    "Respect others' privacy and anonymity",
    "Report inappropriate behavior using the report function",
    "Users must be 18+ years old to participate"
  ];

  const benefits = [
    "Express yourself freely without judgment",
    "Meet like-minded people from around the world", 
    "No data collection or privacy concerns",
    "Join conversations that interest you",
    "24/7 active community",
    "Moderated safe space"
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Box textAlign="center" mb={6}>
          <Typography 
            variant="h2" 
            component="h1" 
            fontWeight="bold" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            👻 GhostChatApp
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4, 
              opacity: 0.9,
              fontSize: { xs: '1.2rem', md: '1.5rem' }
            }}
          >
            Anonymous. Secure. Connected.
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 6, 
              maxWidth: 600, 
              mx: 'auto',
              lineHeight: 1.6,
              opacity: 0.8
            }}
          >
            Join thousands of users in anonymous chat rooms. Express yourself freely, 
            make connections, and chat safely without revealing your identity.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleEnterChat}
            endIcon={<ArrowForward />}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              borderRadius: 3,
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            Enter Chat Rooms
          </Button>
        </Box>

        {/* Features Section */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            ✨ Why Choose GhostChatApp?
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 3,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, color: 'white' }}>
                    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                      {feature.icon}
                      <Typography variant="h6" fontWeight="bold">
                        {feature.title}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Chat Rooms Preview */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            🏠 Available Chat Rooms
          </Typography>
          <Grid container spacing={3}>
            {rooms.map((room, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    color: 'white',
                    textAlign: 'center',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <Typography variant="h4" mb={1}>{room.icon}</Typography>
                  <Typography variant="h6" fontWeight="bold" mb={1}>
                    {room.name}
                  </Typography>
                  <Typography variant="body2" mb={2} sx={{ opacity: 0.8 }}>
                    {room.description}
                  </Typography>
                  <Chip 
                    label={`${room.users} users`} 
                    size="small"
                    sx={{ 
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white'
                    }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Anonymity Benefits */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            🔒 Complete Anonymity Benefits
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 4,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  color: 'white'
                }}
              >
                <Typography variant="h5" mb={3} fontWeight="bold" textAlign="center">
                  🛡️ Privacy Protection
                </Typography>
                <List>
                  {benefits.map((benefit, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Check sx={{ color: '#4ECDC4' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={benefit}
                        sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 4,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  color: 'white'
                }}
              >
                <Typography variant="h5" mb={3} fontWeight="bold" textAlign="center">
                  ⚡ Instant Features
                </Typography>
                <Stack spacing={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}><Chat /></Avatar>
                    <Typography>Instant messaging in public rooms</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}><Person /></Avatar>
                    <Typography>Private direct messaging</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'success.main' }}><Image /></Avatar>
                    <Typography>Share images, GIFs, and audio</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}><Tag /></Avatar>
                    <Typography>Tag users to get their attention</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'error.main' }}><Groups /></Avatar>
                    <Typography>See who's online in real-time</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Rules and Guidelines */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            📋 Community Rules & Guidelines
          </Typography>
          <Paper
            sx={{
              p: 4,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              color: 'white'
            }}
          >
            <Typography variant="h6" mb={3} textAlign="center" color="warning.main">
              <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
              Please read and follow these rules to maintain a safe environment
            </Typography>
            <List>
              {rules.map((rule, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Typography variant="h6" color="primary.main">
                      {index + 1}.
                    </Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary={rule}
                    sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        {/* Security Information */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            🔐 Security & Safety Features
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  color: 'white'
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Shield sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Content Moderation
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Automated systems detect and filter inappropriate content to maintain a safe chat environment.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  color: 'white'
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Warning sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Report System
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Easy-to-use reporting system to flag inappropriate behavior and maintain community standards.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  color: 'white'
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Lock sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Data Protection
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    No personal data stored. All messages are automatically deleted after 24 hours for complete privacy.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Final CTA */}
        <Box textAlign="center">
          <Typography variant="h4" mb={3} fontWeight="bold">
            Ready to Start Chatting Anonymously?
          </Typography>
          <Typography variant="h6" mb={4} sx={{ opacity: 0.8 }}>
            Join thousands of users in safe, anonymous conversations
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleEnterChat}
            endIcon={<ArrowForward />}
            sx={{
              px: 8,
              py: 3,
              fontSize: '1.3rem',
              borderRadius: 3,
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            Enter Chat Rooms Now
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box 
        sx={{ 
          background: 'rgba(0,0,0,0.2)',
          py: 4,
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © 2025 GhostChatApp. Anonymous chatting made safe and simple.
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.5, mt: 1 }}>
            Your privacy is our priority. No data collection, no tracking, just pure anonymous conversation.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;