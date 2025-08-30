import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MatchingPreferences, MatchResult, User } from '../../types/chat';
import apiService from '../../services/api';

interface MatchingState {
  isSearching: boolean;
  foundMatch: MatchResult | null;
  preferences: MatchingPreferences;
  searchStartTime: string | null;
  estimatedWait: number;
  error: string | null;
  searchHistory: MatchResult[];
}

const initialState: MatchingState = {
  isSearching: false,
  foundMatch: null,
  preferences: {
    age_range: [18, 35],
    interests: [],
    language: 'en',
  },
  searchStartTime: null,
  estimatedWait: 0,
  error: null,
  searchHistory: [],
};

// Async thunks
export const startMatching = createAsyncThunk(
  'matching/start',
  async (preferences: MatchingPreferences, { rejectWithValue }) => {
    try {
      const result = await apiService.findMatch(preferences);
      return { result, preferences };
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to start matching';
      return rejectWithValue(message);
    }
  }
);

export const checkMatchingStatus = createAsyncThunk(
  'matching/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const status = await apiService.getMatchingStatus();
      return status;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to check matching status';
      return rejectWithValue(message);
    }
  }
);

export const cancelMatching = createAsyncThunk(
  'matching/cancel',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.cancelMatching();
      return true;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to cancel matching';
      return rejectWithValue(message);
    }
  }
);

const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    // Update preferences
    setPreferences: (state, action: PayloadAction<MatchingPreferences>) => {
      state.preferences = action.payload;
    },
    updatePreferences: (state, action: PayloadAction<Partial<MatchingPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    // Add interest
    addInterest: (state, action: PayloadAction<string>) => {
      const interest = action.payload.trim();
      if (interest && !state.preferences.interests.includes(interest) && state.preferences.interests.length < 10) {
        state.preferences.interests.push(interest);
      }
    },
    
    // Remove interest
    removeInterest: (state, action: PayloadAction<string>) => {
      state.preferences.interests = state.preferences.interests.filter(
        interest => interest !== action.payload
      );
    },
    
    // Set age range
    setAgeRange: (state, action: PayloadAction<[number, number]>) => {
      state.preferences.age_range = action.payload;
    },
    
    // Clear match
    clearMatch: (state) => {
      state.foundMatch = null;
      state.isSearching = false;
      state.searchStartTime = null;
      state.estimatedWait = 0;
      state.error = null;
    },
    
    // Set match found (from WebSocket)
    setMatchFound: (state, action: PayloadAction<MatchResult>) => {
      state.foundMatch = action.payload;
      state.isSearching = false;
      state.searchStartTime = null;
      state.searchHistory.push(action.payload);
    },
    
    // Update estimated wait time
    updateEstimatedWait: (state, action: PayloadAction<number>) => {
      state.estimatedWait = action.payload;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset matching state
    resetMatching: (state) => {
      state.isSearching = false;
      state.foundMatch = null;
      state.searchStartTime = null;
      state.estimatedWait = 0;
      state.error = null;
    },
    
    // Add to search history
    addToSearchHistory: (state, action: PayloadAction<MatchResult>) => {
      state.searchHistory.push(action.payload);
      // Keep only last 10 searches
      if (state.searchHistory.length > 10) {
        state.searchHistory.shift();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Start matching
      .addCase(startMatching.pending, (state) => {
        state.isSearching = true;
        state.error = null;
        state.foundMatch = null;
        state.searchStartTime = new Date().toISOString();
      })
      .addCase(startMatching.fulfilled, (state, action) => {
        const { result, preferences } = action.payload;
        state.preferences = preferences;
        
        if (result.status === 'found') {
          state.isSearching = false;
          state.foundMatch = result;
          state.searchHistory.push(result);
        } else if (result.status === 'searching') {
          state.isSearching = true;
          state.estimatedWait = result.estimated_wait || 15;
        } else {
          state.isSearching = false;
          state.error = result.message || 'Matching failed';
        }
      })
      .addCase(startMatching.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
        state.searchStartTime = null;
      })
      
      // Check status
      .addCase(checkMatchingStatus.fulfilled, (state, action) => {
        const result = action.payload;
        
        if (result.status === 'found') {
          state.isSearching = false;
          state.foundMatch = result;
          state.searchHistory.push(result);
        } else if (result.status === 'searching') {
          // Update wait time if still searching
          if (state.searchStartTime) {
            const elapsed = Math.floor(
              (new Date().getTime() - new Date(state.searchStartTime).getTime()) / 1000
            );
            state.estimatedWait = Math.max(0, 30 - elapsed);
          }
        } else if (result.status === 'timeout') {
          state.isSearching = false;
          state.error = result.message || 'Search timed out';
          state.searchStartTime = null;
        }
      })
      .addCase(checkMatchingStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Cancel matching
      .addCase(cancelMatching.fulfilled, (state) => {
        state.isSearching = false;
        state.foundMatch = null;
        state.searchStartTime = null;
        state.estimatedWait = 0;
        state.error = null;
      })
      .addCase(cancelMatching.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setPreferences,
  updatePreferences,
  addInterest,
  removeInterest,
  setAgeRange,
  clearMatch,
  setMatchFound,
  updateEstimatedWait,
  clearError,
  resetMatching,
  addToSearchHistory,
} = matchingSlice.actions;

export default matchingSlice.reducer;