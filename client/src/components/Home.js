import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CodeIcon from '@mui/icons-material/Code';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import CodingChallenge from './CodingChallenge';
import ChallengeRoom from './ChallengeRoom';
import PracticeRoom from './PracticeRoom';
import { socket } from '../socket';
import './Login.css';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const runningTexts = [
  'Real-time coding battles',
  'Practice and improve your skills',
  'Challenge your friends',
  'Supports C++, Java, Python',
  'Instant code execution',
  'Fun, competitive, and educational!'
];

function Home({ user, onLogout }) {
  const [mode, setMode] = useState('home'); // 'home', 'practice', 'challenge'
  const [roomId, setRoomId] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [loading, setLoading] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [challengeSource, setChallengeSource] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % runningTexts.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Profile menu handlers
  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileClose();
    onLogout();
  };

  // Handlers for UI
  const handleStartPractice = () => setMode('practice');

  const handleCreateChallenge = () => {
    setLoading(true);
    socket.emit('createChallenge', { difficulty: selectedDifficulty }, (response) => {
      setLoading(false);
      if (response.error) {
        setError(response.error);
        return;
      }
      setRoomId(response.roomId);
      setChallenge(response.challenge);
      setChallengeSource(response.source);
      setCreateDialogOpen(true);
    });
  };

  const handleStartChallenge = () => {
    setCreateDialogOpen(false);
    setMode('challenge');
  };

  const handleJoinChallenge = () => {
    if (!joinRoomId.trim()) {
      setError('Please enter a challenge code.');
      return;
    }
    setLoading(true);
    socket.emit('joinChallenge', joinRoomId.trim(), (response) => {
      setLoading(false);
      if (response.error) {
        setError(response.error);
        return;
      }
      setRoomId(joinRoomId.trim());
      setChallenge(response.challenge);
      setJoinDialogOpen(false);
      setMode('challenge');
    });
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setSnackbar('Room ID copied!');
  };

  const handleCloseError = () => setError('');
  const handleCloseSnackbar = () => setSnackbar('');
  const handleExitChallenge = () => {
    setMode('home');
    setRoomId('');
    setJoinRoomId('');
    setChallenge(null);
    setChallengeSource(null);
  };

  // Main UI
  if (mode === 'practice') {
    return <PracticeRoom onExit={handleExitChallenge} user={user} onLogout={onLogout} difficulty={selectedDifficulty} />;
  }
  if (mode === 'challenge') {
    return <ChallengeRoom roomId={roomId} challenge={challenge} challengeSource={challengeSource} onExit={handleExitChallenge} user={user} onLogout={onLogout} difficulty={selectedDifficulty} />;
  }

  // Home screen
  return (
    <div className="auth-container">
      {/* Background with glow orbs */}
      <div className="auth-background">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>

      {/* Status Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Code Arena" 
            style={{
              height: '40px',
              width: 'auto',
              filter: 'drop-shadow(0 0 10px rgba(102, 126, 234, 0.6))',
            }}
          />
        </Box>

        {/* Profile Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
              fontSize: '16px',
            }}
          >
            Welcome, {user?.username}!
          </Typography>
          <IconButton
            onClick={handleProfileClick}
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <AccountCircleIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={profileAnchorEl}
          open={Boolean(profileAnchorEl)}
          onClose={handleProfileClose}
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              mt: 1,
            }
          }}
        >
          <MenuItem onClick={handleLogout} sx={{ minWidth: 150 }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <Typography>Logout</Typography>
          </MenuItem>
        </Menu>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '70px',
          paddingBottom: '40px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              mb: 2,
            }}
          >
            <Typography
              variant="h3"
              align="center"
              sx={{
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.95)',
                mb: 1,
                fontFamily: 'Montserrat, sans-serif',
                letterSpacing: 1,
              }}
            >
              Welcome to Code Arena
            </Typography>
            <Typography
              variant="h6"
              align="center"
              sx={{
                mb: 4,
                minHeight: 40,
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.8)',
                fontFamily: 'Inter, sans-serif',
                transition: 'opacity 0.5s',
                opacity: 1,
              }}
            >
              {runningTexts[textIndex]}
            </Typography>
            
            {/* Difficulty Selector */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
              <Paper elevation={4} sx={{
                px: 2, py: 1, borderRadius: 2,
                background: 'rgba(60, 65, 90, 0.92)',
                border: '1.5px solid #764ba2',
                display: 'flex', alignItems: 'center',
                minWidth: 0,
                boxShadow: '0 0 12px 2px #764ba233',
              }}>
                <Typography variant="subtitle1" sx={{ color: '#b7aaff', fontWeight: 600, mr: 1, letterSpacing: 0.5 }}>
                  Challenge Level:
                </Typography>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120, ml: 1, background: '#23243a', borderRadius: 1, boxShadow: '0 0 8px 1px #667eea44', border: '1.5px solid #667eea' }}>
                  <Select
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value)}
                    displayEmpty
                    sx={{ fontWeight: 600, fontSize: 15, color: 'white', background: '#23243a', borderRadius: 1, border: 'none', boxShadow: '0 0 6px 1px #667eea55' }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          background: '#23243a',
                          color: 'white',
                          border: '1.5px solid #667eea',
                        }
                      }
                    }}
                  >
                    <MenuItem value="" disabled>Select...</MenuItem>
                    <MenuItem value="Beginner">
                      <span role="img" aria-label="Beginner">🟢</span> Beginner
                    </MenuItem>
                    <MenuItem value="Intermediate">
                      <span role="img" aria-label="Intermediate">🟡</span> Intermediate
                    </MenuItem>
                    <MenuItem value="Advanced">
                      <span role="img" aria-label="Advanced">🔴</span> Advanced
                    </MenuItem>
                  </Select>
                </FormControl>
              </Paper>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleStartPractice}
                  disabled={loading || !selectedDifficulty}
                  sx={{
                    py: 2,
                    fontSize: 18,
                    fontWeight: 600,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                    },
                    '&:disabled': {
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  Practice Mode
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Typography 
                  variant="body1" 
                  align="center" 
                  sx={{ 
                    my: 2, 
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 500,
                  }}
                >
                  — OR —
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleCreateChallenge}
                  disabled={loading || !selectedDifficulty}
                  sx={{
                    py: 2,
                    fontSize: 18,
                    fontWeight: 600,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(240, 147, 251, 0.6)',
                    },
                    '&:disabled': {
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  {loading ? 'Creating...' : 'Challenge a Friend'}
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => setJoinDialogOpen(true)}
                  disabled={loading}
                  sx={{
                    py: 2,
                    fontSize: 18,
                    fontWeight: 600,
                    borderRadius: 3,
                    color: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      color: 'rgba(255, 255, 255, 0.3)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Join with Code
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* Join Challenge Dialog */}
      <Dialog 
        open={joinDialogOpen} 
        onClose={() => setJoinDialogOpen(false)} 
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          color: '#333',
          textAlign: 'center',
        }}>
          Join Challenge
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#666', mb: 2 }}>
            Enter the challenge code provided by your friend:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Challenge Code"
            fullWidth
            variant="outlined"
            value={joinRoomId}
            onChange={e => setJoinRoomId(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setJoinDialogOpen(false)} 
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleJoinChallenge} 
            variant="contained" 
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            {loading ? 'Joining...' : 'Join'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Challenge Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          color: '#333',
          textAlign: 'center',
        }}>
          Challenge Created!
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#666', mb: 2 }}>
            Share this code with your opponent to start the challenge:
          </DialogContentText>
          {challengeSource && (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <Chip 
                label={`Generated by ${challengeSource === 'gemini' ? 'AI' : 'Sample Set'}`}
                color={challengeSource === 'gemini' ? 'primary' : 'default'}
                icon={challengeSource === 'gemini' ? <AutoAwesomeIcon /> : <CodeIcon />}
                sx={{ 
                  fontWeight: 600,
                  background: challengeSource === 'gemini' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'rgba(0, 0, 0, 0.1)',
                  color: challengeSource === 'gemini' ? 'white' : '#666',
                }}
              />
            </Box>
          )}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 2,
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: 2,
            border: '1px solid rgba(102, 126, 234, 0.2)',
          }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                color: '#333', 
                letterSpacing: 2, 
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              {roomId}
            </Typography>
            <IconButton 
              onClick={handleCopyRoomId} 
              color="primary" 
              size="small"
              sx={{ 
                color: '#667eea',
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.1)',
                },
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)} 
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStartChallenge} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
              },
            }}
          >
            Start Challenge
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbar}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Home; 