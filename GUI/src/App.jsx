import './App.css'

function App () {
  return (
    <div className='App'>
      <header className='App-header'>
        <h1>Welcome to AxioDB Control Center</h1>
      </header>
      <main>
        <p>Here you can access AxioDB-Docker’s GUI features:</p>
        <ul className='features'>
          <li>Import</li>
          <li>Export</li>
          <li>CRUD Operations</li>
          <li>And more…</li>
        </ul>
        <section className='upcoming-features'>
          <h2>Upcoming Features</h2>
          <ul>
            <li>Dashboard & Analytics</li>
            <li>User Management</li>
            <li>Role-Based Access</li>
            <li>Multi-Database Support</li>
            <li>Custom Themes</li>
          </ul>
        </section>
        <p className='under-development'>
          This site is currently <strong>Under Development</strong>. Please wait
          for the Stable Release.
        </p>
      </main>
    </div>
  )
}

export default App
