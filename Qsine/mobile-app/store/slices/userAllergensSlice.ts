import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@user_allergens';

interface UserAllergensState {
  selectedAllergens: string[];
}

const initialState: UserAllergensState = {
  selectedAllergens: [],
};

// Async Thunk to load allergens from AsyncStorage
export const loadAllergens = createAsyncThunk(
  'userAllergens/loadAllergens',
  async () => {
    try {
      const storedAllergens = await AsyncStorage.getItem(STORAGE_KEY);
      return storedAllergens ? JSON.parse(storedAllergens) : [];
    } catch (error) {
      console.error('Error loading allergens from storage:', error);
      return [];
    }
  }
);

const userAllergensSlice = createSlice({
  name: 'userAllergens',
  initialState,
  reducers: {
    setAllergens: (state, action: PayloadAction<string[]>) => {
      state.selectedAllergens = action.payload;
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload)).catch(error => {
        console.error('Error saving allergens to storage:', error);
      });
    },
    clearAllergens: (state) => {
      state.selectedAllergens = [];
      void AsyncStorage.removeItem(STORAGE_KEY).catch(error => {
        console.error('Error clearing allergens from storage:', error);
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadAllergens.fulfilled, (state, action) => {
      state.selectedAllergens = action.payload;
    });
  },
});

export const { setAllergens, clearAllergens } = userAllergensSlice.actions;
export default userAllergensSlice.reducer;
