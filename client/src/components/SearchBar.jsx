import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import InputBase, { InputBaseProps } from '@mui/material/InputBase'
import Paper from '@mui/material/Paper';
import { useEffect } from "react";
import * as React from 'react';
import { useLazyGetAddressInfoQuery } from "../redux/apis/mapsApi/geocodeApi"
import { updateCenter } from '../redux/slices/mapSlice';
import { useDispatch } from "react-redux"

const address = '1560 Memorial Dr SE, Atlanta, GA 30317';
export default function SearchBar() {
    const dispatch = useDispatch();
    const [trigger, { isFetching, data, error, isError, isUninitialized }] = useLazyGetAddressInfoQuery()

    const handleEnter = (event) => {
        //Line below prevents refresh on enter
        event.preventDefault()
        console.log("GOT here")

        if (event.key !== "Enter")
            return

        console.log("send message to google")
        trigger(address)
    }

    const handleSearch = () => {
        console.log("send message to GOOGLE")
    }

    useEffect(() => {
        if (isUninitialized)
            return
        if (isFetching) {
            console.log("Loading...")
            return
        }
        if (isError) {
            console.error(error)
            return
        }
        if (!data) {
            console.error("No data")
            return
        }
        //console.log("Got", data.results[0].geometry.location)
        dispatch(updateCenter({lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng}))
        
    }, [isFetching, data, error, isError, isUninitialized])

    return (
        <Paper
            component="form"
            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
        >
            <IconButton sx={{ p: '10px' }} aria-label="menu">
                <MenuIcon/>
            </IconButton>
            <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder="Search"
                inputProps={{ 'aria-label': 'search' }}
                onKeyDown={handleEnter}
            />
            <IconButton
                type="button"
                sx={{ p: '10px' }}
                aria-label="search"
                onClick={handleSearch}
            >
                <SearchIcon/>
            </IconButton>
        </Paper>
    )
}