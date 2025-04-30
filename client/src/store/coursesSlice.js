import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://ip.dhronz.space/courses';

export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL);

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch courses');
    }
  }
);

const initialState = {
  courses: [],
  status: 'idle', 
  error: null
};

// Create the courses slice
const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.courses = action.payload;
        console.log('Redux state updated:', state.courses); // Debug state update
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      });
  }
});

export default coursesSlice.reducer;