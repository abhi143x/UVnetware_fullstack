import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,   
    isLoading: false,
    error: null,
};
const userSlice=createSlice({
  name: 'user', 
  initialState,
    reducers: { 
    signInStart: (state) => {
      state.isLoading = true;
      state.error = null;
    } ,
    signInSuccess: (state, action) => { 
        state.isLoading = false;
        state.currentUser = action.payload;
        state.error = null;
        },
    signInFailure: (state, action) => { 
        state.isLoading = false;
        state.error = action.payload;
        state.currentUser = null;
    },
    updateUserStart: (state) => {
      state.isLoading = true;
      
    },
    updateUserSuccess: (state, action) => {
      state.isLoading = false;
      state.currentUser = action.payload;
      state.error = null;
    },
    updateUserFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    deleteUserStart: (state) => {
      state.isLoading = true;
      
    },
    deleteUserSuccess: (state) => {
      state.isLoading = false;
      state.currentUser = null;
      state.error = null;
    },
    deleteUserFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    signOutUserStart: (state) => {
      state.isLoading = true;
      
    },
    signOutUserSuccess: (state) => {
      state.isLoading = false;
      state.currentUser = null;
      state.error = null;
    },
    signOutUserFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  
  }

});
export const {signInStart, signInSuccess,signInFailure,updateUserFailure,updateUserStart,updateUserSuccess,deleteUserFailure,deleteUserStart,deleteUserSuccess,signOutUserFailure,signOutUserStart,signOutUserSuccess} = userSlice.actions;
export default userSlice.reducer;   
