import './AppBarSelectors.scss'

import { Grid, MenuItem, TextField } from '@mui/material'
import { useContext, useMemo } from 'react'

import AppContext from '../../AppContext'

const AppBarSelectors = () => {
  const {
    selectedSchoolID,
    loggedinUser,
    setSelectedSchoolID,
    selectedSchool,
    selectedAcademicYear,
    setSelectedAcademicYear,
  } = useContext(AppContext)

  const acaYears = useMemo(
    () =>
      Object.entries(selectedSchool?.aca_years || {})
        // eslint-disable-next-line no-unused-vars
        .filter(([_year, { active }]) => active)
        .map(([year]) => year),
    [selectedSchool?.aca_years],
  )

  return (
    <>
      {loggedinUser?.schools?.length > 1 && (
        <Grid item>
          <TextField
            className="app-bar-selector"
            margin="none"
            select
            value={selectedSchoolID || ''}
            onChange={(e) => setSelectedSchoolID(e.target.value)}
          >
            {loggedinUser?.schools?.map((school) => (
              <MenuItem key={school.school_id} value={school.school_id}>
                {`${school.school_id} - ${school.name}`}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
      {Boolean(acaYears?.length) && (
        <Grid item>
          <TextField
            className="app-bar-selector"
            margin="none"
            select
            value={selectedAcademicYear || ''}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
          >
            {acaYears?.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
    </>
  )
}

export default AppBarSelectors
