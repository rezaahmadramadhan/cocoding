import { configureStore } from '@reduxjs/toolkit';
import coursesReducer from './coursesSlice';
import courseDetailReducer from './courseDetailSlice';

const store = configureStore({
  reducer: {
    courses: coursesReducer,
    courseDetail: courseDetailReducer,
  },
});

export default store;