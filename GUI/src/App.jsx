import './App.css'

export default function App () {
  return (
    <div className='landing-page'>
      <div className='hero'>
        <div className='loader' />
        <h1>AxioDB Control Board</h1>
        <p className='subtitle'>
          A next-generation GUI for AxioDB-Docker is{' '}
          <strong>Coming Soon</strong>
        </p>
      </div>

      <section className='features'>
        <h2>Upcoming Features</h2>
        <div className='cards'>
          <div className='card'>
            <h3>Import & Export</h3>
          </div>
          <div className='card'>
            <h3>CRUD Operations</h3>
          </div>
          <div className='card'>
            <h3>Dashboard & Analytics</h3>
          </div>
          <div className='card'>
            <h3>User Management</h3>
          </div>
          <div className='card'>
            <h3>Role-Based Access</h3>
          </div>
        </div>
      </section>

      <footer>
        <p>Site under development — stay tuned for the stable release.</p>
      </footer>
    </div>
  )
}
