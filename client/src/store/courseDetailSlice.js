import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://ip.dhronz.space/courses';

export const fetchCourseDetail = createAsyncThunk(
  'courseDetail/fetchCourseDetail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch course detail');
    }
  }
);

const initialState = {
  courseDetail: null,
  status: 'idle',
  error: null
};

const courseDetailSlice = createSlice({
  name: 'courseDetail',
  initialState,
  reducers: {
    resetCourseDetail: (state) => {
      state.courseDetail = null;
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseDetail.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCourseDetail.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.courseDetail = action.payload;
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      });
  }
});

export const { resetCourseDetail } = courseDetailSlice.actions;
export default courseDetailSlice.reducer;