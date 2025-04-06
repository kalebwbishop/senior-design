import { configureStore } from '@reduxjs/toolkit';
import userAllergensReducer from './slices/userAllergensSlice';
import { thunk } from 'redux-thunk';

export const store = configureStore({
  reducer: {
    userAllergens: userAllergensReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 