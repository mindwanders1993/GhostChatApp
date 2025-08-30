import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  IconButton,
  Paper,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Security,
  Chat,
  Add,
  Close,
  LocationOn,
  Wc,
  CheckCircle,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { registerUser } from '../../store/slices/authSlice';
import { MatchingPreferences } from '../../types/chat';

const steps = ['Profile Setup', 'Location & Gender', 'Terms & Safety'];

const RegisterScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const selectedRoom = location.state?.selectedRoom || null;
  
  const [activeStep, setActiveStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [ageVerified, setAgeVerified] = useState(false);
  const [gender, setGender] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [detectedLocation, setDetectedLocation] = useState('');
  const [preferences, setPreferences] = useState<MatchingPreferences>({
    age_range: [18, 35],
    interests: [],
    language: 'en',
  });
  const [newInterest, setNewInterest] = useState('');
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      if (selectedRoom) {
        navigate(`/chat/${selectedRoom}`);
      } else {
        navigate('/rooms');
      }
    }
  }, [isAuthenticated, navigate, selectedRoom]);

  React.useEffect(() => {
    // Detect user location (mock)
    const detectLocation = async () => {
      try {
        // Simulate geolocation detection
        setTimeout(() => {
          setDetectedLocation('United States');
        }, 1000);
      } catch (error) {
        console.error('Location detection failed:', error);
      }
    };
    
    detectLocation();
  }, []);

  const handleNext = () => {
    if (activeStep === 0 && (!nickname.trim() || !ageVerified)) {
      return;
    }
    if (activeStep === 1 && (!gender || !userLocation)) {
      return;
    }
    if (activeStep === 2 && (!agreedToGuidelines || !agreedToTerms)) {
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAddInterest = () => {
    const interest = newInterest.trim();
    if (interest && !preferences.interests.includes(interest) && preferences.interests.length < 5) {
      setPreferences(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSubmit = async () => {
    if (!nickname.trim() || !ageVerified || !gender || !userLocation || !agreedToGuidelines || !agreedToTerms) {
      return;
    }

    try {
      await dispatch(registerUser({
        nickname: nickname.trim(),
        age_verified: ageVerified,
        gender,
        location: userLocation,
        preferences,
      })).unwrap();
      
      if (selectedRoom) {
        navigate(`/chat/${selectedRoom}`);
      } else {
        navigate('/rooms');
      }
    } catch (error) {
      // Error is handled by the Redux slice
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ space: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Choose Your Anonymous Identity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a username that keeps your identity private
                </Typography>
              </Box>
            </Stack>

            {selectedRoom && (
              <Alert severity="info" sx={{ mb: 3 }}>
                You're joining the selected chat room after registration
              </Alert>
            )}

            <TextField
              fullWidth
              label="Username/Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              error={!nickname.trim() && activeStep > 0}
              helperText={!nickname.trim() && activeStep > 0 ? 'Username is required' : 'Only letters, numbers, hyphens, and underscores allowed'}
              inputProps={{ maxLength: 20 }}
              sx={{ mb: 3 }}
              placeholder="e.g. GamerGhost, MusicLover23"
            />

            <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <CheckCircle color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Age Verification Required
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" paragraph>
                This platform is for adults only. By proceeding, you confirm you meet the age requirement.
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={ageVerified}
                    onChange={(e) => setAgeVerified(e.target.checked)}
                    color="primary"
                  />
                }
                label="I confirm that I am 18 years or older"
              />
            </Paper>

            {!ageVerified && (
              <Alert severity="warning">
                Age verification is required to continue
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ space: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <Wc />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Gender & Location
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Help us provide better matching and regional content
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={gender}
                    label="Gender"
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="non-binary">Non-binary</MenuItem>
                    <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Location</InputLabel>
                    <Select
                      value={userLocation}
                      label="Location"
                      onChange={(e) => setUserLocation(e.target.value)}
                    >
                      <MenuItem value="United States">United States</MenuItem>
                      <MenuItem value="Canada">Canada</MenuItem>
                      <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                      <MenuItem value="Australia">Australia</MenuItem>
                      <MenuItem value="Germany">Germany</MenuItem>
                      <MenuItem value="France">France</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {detectedLocation && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LocationOn color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        Detected: {detectedLocation}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Grid>
            </Grid>

            <Paper sx={{ p: 3, mt: 3, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                Privacy Note
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This information is used only for matching preferences and regional content. 
                Your exact location is never shared with other users.
              </Typography>
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ space: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <Security />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Terms & Safety Agreement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review and accept our community standards
                </Typography>
              </Box>
            </Stack>

            <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
              <Typography variant="subtitle1" gutterBottom color="error.main">
                📋 Community Guidelines
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Respect Everyone:</strong> Treat all users with kindness and respect regardless of background
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Protect Privacy:</strong> Never share personal information (real names, addresses, phone numbers)
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Keep it Clean:</strong> No explicit content, harassment, hate speech, or inappropriate behavior
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Report Issues:</strong> Use the report function for any suspicious or harmful behavior
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>Stay Safe:</strong> Remember conversations are temporary and automatically deleted after 24 hours
                </Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
              <Typography variant="subtitle1" gutterBottom color="success.main">
                🛡️ Your Safety Tools
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" paragraph>
                    <strong>• Block Users:</strong> Instantly block anyone making you uncomfortable
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>• Emergency Exit:</strong> Quick disconnect button to leave immediately
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" paragraph>
                    <strong>• Report System:</strong> Flag inappropriate behavior to moderators
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>• AI Moderation:</strong> Automated content filtering for your protection
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreedToGuidelines}
                    onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                    color="primary"
                  />
                }
                label="I agree to follow the community guidelines and respect other users' safety and privacy"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    color="primary"
                  />
                }
                label="I accept the Terms of Service and Privacy Policy, and confirm I am 18+ years old"
              />
            </Stack>

            {(!agreedToGuidelines || !agreedToTerms) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Both agreements are required to proceed
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha('#6366f1', 0.1)} 0%, ${alpha('#ec4899', 0.1)} 100%)`
          : `linear-gradient(135deg, ${alpha('#6366f1', 0.05)} 0%, ${alpha('#ec4899', 0.05)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate('/')} sx={{ mb: 2 }}>
            <ArrowBack />
          </IconButton>
          
          <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
            Join GhostChat
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create your anonymous profile in just a few steps
          </Typography>
        </Box>

        <Card sx={{ p: 2 }}>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
              >
                Back
              </Button>
              
              <Box sx={{ flex: 1 }} />
              
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 && (!nickname.trim() || !ageVerified)) ||
                    (activeStep === 1 && (!gender || !userLocation)) ||
                    (activeStep === 2 && (!agreedToGuidelines || !agreedToTerms))
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!nickname.trim() || !ageVerified || !gender || !userLocation || !agreedToGuidelines || !agreedToTerms || isLoading}
                >
                  {isLoading ? 'Creating Profile...' : selectedRoom ? 'Join Chat Room' : 'Start Chatting'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default RegisterScreen;