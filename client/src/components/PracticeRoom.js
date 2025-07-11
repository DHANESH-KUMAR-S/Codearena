import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import StopIcon from '@mui/icons-material/Stop';
import EditorWrapper from './EditorWrapper';
import { socket } from '../socket';
import './Login.css';

const PracticeRoom = ({ onExit, user, onLogout, difficulty = 'Beginner' }) => {
  const [challenges, setChallenges] = useState([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [status, setStatus] = useState('loading');
  const [result, setResult] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [startTime, setStartTime] = useState(null);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const [practiceEndDialog, setPracticeEndDialog] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState(0);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [isPracticeActive, setIsPracticeActive] = useState(false);
  const isInitialized = React.useRef(false);
  const [challengeSource, setChallengeSource] = useState(null);

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

  useEffect(() => {
    // Load all challenges for practice mode
    console.log('PracticeRoom: Emitting getPracticeChallenges');
    console.log('PracticeRoom: Socket connected:', socket.connected);
    
    if (!socket.connected) {
      console.log('PracticeRoom: Socket not connected, waiting for connection...');
      socket.on('connect', () => {
        console.log('PracticeRoom: Socket connected, now requesting challenges');
        requestChallenges();
      });
      return;
    }
    
    requestChallenges();
  }, [difficulty]);

  const requestChallenges = () => {
    const timeout = setTimeout(() => {
      setNotification({
        open: true,
        message: 'Failed to load challenges. Please try again.',
        severity: 'error'
      });
      setStatus('error');
    }, 20000); // 20 second timeout for Gemini

    setChallengeSource(null);
    setStatus('loading');

    socket.emit('getPracticeChallenges', { difficulty }, (response) => {
      clearTimeout(timeout);
      if (response.error) {
        setNotification({
          open: true,
          message: response.error,
          severity: 'error'
        });
        setStatus('error');
        return;
      }
      setChallenges(response.challenges);
      setChallenge(response.challenges[0]);
      setCode((response.challenges[0].boilerplateCode && response.challenges[0].boilerplateCode[language]) || '');
      setStatus('ready');
      setChallengeSource(response.source);
      isInitialized.current = true;
    });
  };

  useEffect(() => {
    let timer;
    if (isPracticeActive && startTime) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPracticeActive, startTime]);

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    setLanguage(newLang);
    // Always reset to boilerplate for the new language
    let newCode = '';
    if (challenge && challenge.boilerplateCode && challenge.boilerplateCode[newLang]) {
      newCode = challenge.boilerplateCode[newLang];
    }
    setCode(typeof newCode === 'string' ? newCode : '');
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      setNotification({
        open: true,
        message: 'Please write some code before submitting',
        severity: 'warning'
      });
      return;
    }

    socket.emit('submitPracticeSolution', {
      code,
      language,
      challengeId: challenge.id
    });
  };

  const handleStartPractice = () => {
    setIsPracticeActive(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setSolvedProblems(0);
    setCurrentChallengeIndex(0);
    setChallenge(challenges[0]);
    setCode((challenges[0].boilerplateCode && challenges[0].boilerplateCode[language]) || '');
    setResult(null);
    setHasUserTyped(false);
    isInitialized.current = true;
    setStatus('started');
    setNotification({
      open: true,
      message: 'Practice started! Good luck!',
      severity: 'success'
    });
  };

  const handleEndPractice = () => {
    setIsPracticeActive(false);
    setPracticeEndDialog(true);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClosePracticeEndDialog = () => {
    setPracticeEndDialog(false);
  };

  const handleNextProblem = () => {
    if (currentChallengeIndex < challenges.length - 1) {
      const nextIndex = currentChallengeIndex + 1;
      setCurrentChallengeIndex(nextIndex);
      setChallenge(challenges[nextIndex]);
      setCode((challenges[nextIndex].boilerplateCode && challenges[nextIndex].boilerplateCode[language]) || '');
      setResult(null);
      setHasUserTyped(false);
      isInitialized.current = true;
      setNotification({
        open: true,
        message: `Next problem: ${challenges[nextIndex].title}`,
        severity: 'info'
      });
    }
  };

  // Listen for submission results
  useEffect(() => {
    socket.on('practiceSubmissionResult', (validation) => {
      setResult(validation);
      if (validation.error) {
        setNotification({
          open: true,
          message: `Error: ${validation.error}`,
          severity: 'error'
        });
      } else if (validation.passed) {
        setSolvedProblems(prev => prev + 1);
        setNotification({
          open: true,
          message: 'Correct! Problem solved!',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Some test cases failed. Check the results below.',
          severity: 'warning'
        });
      }
    });

    return () => {
      socket.off('practiceSubmissionResult');
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="auth-container">
        <div className="auth-background">
          <div className="glow-orb glow-orb-1"></div>
          <div className="glow-orb glow-orb-2"></div>
          <div className="glow-orb glow-orb-3"></div>
        </div>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" sx={{ position: 'relative', zIndex: 2 }}>
          <CircularProgress sx={{ color: 'white', mb: 2 }} />
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Loading practice challenges from AI...
          </Typography>
        </Box>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-container">
        <div className="auth-background">
          <div className="glow-orb glow-orb-1"></div>
          <div className="glow-orb glow-orb-2"></div>
          <div className="glow-orb glow-orb-3"></div>
        </div>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography sx={{ color: '#ff6b6b', mb: 2, fontSize: '1.2rem' }}>
            Failed to load practice challenges
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setStatus('loading');
              requestChallenges();
            }}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Retry
          </Button>
        </Box>
      </div>
    );
  }

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
          <MenuItemComponent onClick={handleLogout} sx={{ minWidth: 150 }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <Typography>Logout</Typography>
          </MenuItemComponent>
        </Menu>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        p: 3, 
        paddingTop: '90px', 
        minHeight: '100vh',
        position: 'relative',
        zIndex: 2,
      }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%', 
                overflow: 'auto',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Practice Mode
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label={`${currentChallengeIndex + 1}/${challenges.length}`}
                    sx={{ 
                      background: 'rgba(102, 126, 234, 0.2)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                    }}
                  />
                  {challengeSource && (
                    <Chip
                      label={challengeSource === 'gemini' ? 'Generated by Gemini AI' : 'Loaded from fallback set'}
                      color={challengeSource === 'gemini' ? 'info' : 'warning'}
                      sx={{ ml: 1, fontWeight: 600 }}
                    />
                  )}
                </Box>
              </Box>
              
              {challenge && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    {challenge.title}
                  </Typography>
                  <Chip 
                    label={difficulty ? difficulty.toUpperCase() : (challenge.difficulty || '').toUpperCase()} 
                    color={
                      (difficulty === 'Beginner' || challenge.difficulty === 'easy') ? 'success' : 
                      (difficulty === 'Intermediate' || challenge.difficulty === 'medium') ? 'warning' : 'error'
                    }
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
                    {challenge.description}
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    Input Format:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
                    {challenge.inputFormat}
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    Output Format:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
                    {challenge.outputFormat}
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    Constraints:
                  </Typography>
                  <ul style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {challenge.constraints.map((constraint, index) => (
                      <li key={index}>
                        <Typography variant="body2">{constraint}</Typography>
                      </li>
                    ))}
                  </ul>
                  <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    Examples:
                  </Typography>
                  {challenge.examples.map((example, index) => (
                    <Card 
                      key={index} 
                      variant="outlined" 
                      sx={{ 
                        mb: 2,
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Input:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                          {example.input}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Output:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                          {example.output}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Explanation:
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'rgba(255, 255, 255, 0.8)' }}>
                          {example.explanation}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>Language</InputLabel>
                  <Select
                    value={language}
                    onChange={handleLanguageChange}
                    label="Language"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                      '& .MuiSvgIcon-root': {
                        color: 'rgba(255, 255, 255, 0.8)',
                      },
                    }}
                  >
                    <MenuItem value="python">Python</MenuItem>
                    <MenuItem value="cpp">C++</MenuItem>
                    <MenuItem value="java">Java</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      if (challenge && challenge.boilerplateCode && challenge.boilerplateCode[language]) {
                        setCode((challenge && challenge.boilerplateCode && challenge.boilerplateCode[language]) || '');
                        setHasUserTyped(false);
                        isInitialized.current = false;
                      }
                    }}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Reset Code
                  </Button>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 600,
                    }}
                  >
                    Time: {formatTime(elapsedTime)}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'rgba(102, 126, 234, 0.9)',
                      fontWeight: 600,
                    }}
                  >
                    Solved: {solvedProblems}
                  </Typography>
                </Box>
              </Box>

              <EditorWrapper
                key={language}
                value={code}
                onChange={(value) => {
                  setCode(value || '');
                  // Mark that user has started typing
                  if (!hasUserTyped && value && value.trim() !== '') {
                    setHasUserTyped(true);
                  }
                }}
                language={language === 'cpp' ? 'cpp' : language}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  tabSize: 4,
                  wordWrap: 'on',
                  overviewRulerBorder: false,
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                  }
                }}
              />

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {status === 'ready' && !isPracticeActive && (
                    <Button
                      variant="contained"
                      onClick={handleStartPractice}
                      sx={{ 
                        minWidth: 150,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        },
                      }}
                    >
                      Start Practice
                    </Button>
                  )}
                  {isPracticeActive && (
                    <>
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        sx={{ 
                          minWidth: 150,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          },
                        }}
                      >
                        Submit Solution
                      </Button>
                      {result && result.passed && currentChallengeIndex < challenges.length - 1 && (
                        <Button
                          variant="outlined"
                          onClick={handleNextProblem}
                          sx={{ 
                            minWidth: 150,
                            color: 'rgba(255, 255, 255, 0.9)',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            '&:hover': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                              background: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          Next Problem
                        </Button>
                      )}
                    </>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {isPracticeActive && (
                    <Button
                      variant="outlined"
                      startIcon={<StopIcon />}
                      onClick={handleEndPractice}
                      sx={{ 
                        minWidth: 150,
                        color: '#ff6b6b',
                        borderColor: '#ff6b6b',
                        '&:hover': {
                          borderColor: '#ff5252',
                          background: 'rgba(255, 107, 107, 0.1)',
                        },
                      }}
                    >
                      End Practice
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    onClick={onExit}
                    sx={{ 
                      minWidth: 120,
                      color: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Exit Practice
                  </Button>
                </Box>
              </Box>

              {result && result.results && (
                <Paper sx={{ 
                  mt: 3, 
                  p: 2, 
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.95)' }}>
                      Test Results
                    </Typography>
                    {result.passed ? (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label="All Tests Passed" 
                        color="success" 
                        variant="outlined" 
                      />
                    ) : (
                      <Chip 
                        icon={<ErrorIcon />} 
                        label="Some Tests Failed" 
                        color="error" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                  {result.results.map((testResult, index) => (
                    <Card 
                      key={index} 
                      variant="outlined" 
                      sx={{ 
                        mb: 2, 
                        borderColor: testResult.passed ? 'success.main' : 'error.main',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" color={testResult.passed ? "success.main" : "error.main"}>
                            Test Case {index + 1}
                          </Typography>
                          <Chip 
                            size="small"
                            label={testResult.passed ? "Passed" : "Failed"}
                            color={testResult.passed ? "success" : "error"}
                          />
                        </Box>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Input:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                            {testResult.input}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Expected Output:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                            {testResult.expected}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Your Output:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                            {testResult.actual}
                          </Typography>
                          {testResult.error && (
                            <>
                              <Typography variant="subtitle2" color="error">
                                Error:
                              </Typography>
                              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                                {testResult.error}
                              </Typography>
                            </>
                          )}
                          {testResult.time && (
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Execution time: {testResult.time}ms
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Paper>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity}>
            {notification.message}
          </Alert>
        </Snackbar>

        {/* Practice End Dialog */}
        <Dialog
          open={practiceEndDialog}
          onClose={handleClosePracticeEndDialog}
          maxWidth="sm"
          fullWidth
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
          <DialogContent sx={{ textAlign: 'center', py: 4 }}>
            <EmojiEventsIcon sx={{ fontSize: 80, color: '#FFD700', mb: 2 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
              Practice Complete!
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
              {solvedProblems > 0 ? (
                <>
                  WOW.. YOU SOLVED {solvedProblems} PROBLEM{solvedProblems > 1 ? 'S' : ''} IN {formatTime(elapsedTime)}!
                </>
              ) : (
                'No problems solved yet. Keep practicing!'
              )}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
              {solvedProblems > 0 
                ? `Great job! You solved ${solvedProblems} out of ${challenges.length} problems in ${formatTime(elapsedTime)}.`
                : 'Don\'t give up! Practice makes perfect. Try again and you\'ll improve!'
              }
            </Typography>
            <Box sx={{ 
              bgcolor: 'rgba(102, 126, 234, 0.1)', 
              p: 2, 
              borderRadius: 2, 
              mb: 3,
              border: '1px solid rgba(102, 126, 234, 0.2)',
            }}>
              <Typography variant="h6" sx={{ mb: 1, color: '#333' }}>
                Final Stats
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Problems Solved: {solvedProblems}/{challenges.length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Total Time: {formatTime(elapsedTime)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              onClick={handleClosePracticeEndDialog}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </div>
  );
};

export default PracticeRoom; 