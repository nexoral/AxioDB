import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Footer from '../layout/Footer'
import Header from '../layout/Header'
import Dashboard from '../pages/Dashboard'
import Databases from '../pages/Databases'
import Collections from '../pages/Collections'

import Documents from '../pages/Documents'
import ApiReference from '../pages/ApiReference'
import Support from '../pages/Support'
import Status from '../pages/Status'
import Import from '../pages/Import'

/**
 * Main application configuration component
 * Sets up routing and overall layout structure
 */
function MainConfig () {
  return (
    <Router>
      <div className='min-h-screen bg-gray-50 flex flex-col'>
        <Header />
        <main className='flex-grow'>
          <Routes>
            <Route path='/' element={<Dashboard />} />
            <Route path='/operations' element={<Databases />} />
            <Route path='/collections' element={<Collections />} />
            <Route path='/documents' element={<Documents />} />
            <Route path='/api' element={<ApiReference />} />
            <Route path='/support' element={<Support />} />
            <Route path='/status' element={<Status />} />
            <Route path='/import' element={<Import />} />
            <Route path='/collections/documents' element={<Documents />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default MainConfig
