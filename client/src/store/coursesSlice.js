import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://ip.dhronz.space/courses';

export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { search, page = 1, sort, filter } = params;
      let url = API_URL;
      
      // Add query parameters
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (page) queryParams.append('page', page);
      if (sort) queryParams.append('sort', sort);
      if (filter) queryParams.append('filter', filter);
      
      // Append query string to URL if we have parameters
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await axios.get(url);

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return {
          courses: response.data.data,
          pagination: {
            page: response.data.page || 1,
            maxPage: response.data.maxPage || 1,
            totalData: response.data.totalData || 0,
            pageData: response.data.pageData || response.data.data.length
          }
        };
      }
      
      return { 
        courses: Array.isArray(response.data) ? response.data : [],
        pagination: { 
          page: 1, 
          maxPage: 1, 
          totalData: Array.isArray(response.data) ? response.data.length : 0,
          pageData: Array.isArray(response.data) ? response.data.length : 0
        }
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch courses');
    }
  }
);

const initialState = {
  courses: [],
  status: 'idle', 
  error: null,
  pagination: {
    page: 1,
    maxPage: 1,
    totalData: 0,
    pageData: 0
  },
  searchParams: {
    search: '',
    sort: '',
    filter: '',
    page: 1
  }
};

// Create the courses slice
const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setSearchParams: (state, action) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    resetSearch: (state) => {
      state.searchParams = {
        search: '',
        sort: '',
        filter: '',
        page: 1
      };
      state.pagination.page = 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.courses = action.payload.courses;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      });
  }
});

export const { setSearchParams, resetSearch } = coursesSlice.actions;
export default coursesSlice.reducer;