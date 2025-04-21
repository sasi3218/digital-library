import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
    // State for login
    const [isLoggedIn, setIsLoggedIn] = useState(
        localStorage.getItem('isLoggedIn') === 'true'
    );
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // State for file management
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [file, setFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [search, setSearch] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    // Hardcoded credentials
    const users = {
        admin: { username: 'admin', password: 'admin', role: 'admin' },
        viewer: { username: 'user', password: 'user', role: 'viewer' },
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const user = Object.values(users).find(
            (u) => u.username === username && u.password === password
        );

        if (user) {
            setIsLoggedIn(true);
            setUserRole(user.role);
            setLoginError('');
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', user.role);
        } else {
            setLoginError('Invalid username or password');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUserRole('');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
    };

    const fetchFiles = async () => {
        const response = await axios.get('https://digital-library-production-c64a.up.railway.app/api/files');
        setFiles(response.data);
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchFiles();
        }
    }, [isLoggedIn]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!year || !month || !file) {
            alert('Please fill all fields');
            return;
        }

        const formData = new FormData();
        formData.append('year', year);
        formData.append('month', month);
        formData.append('file', file);

        await axios.post('https://digital-library-production-c64a.up.railway.app/api/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        fetchFiles();
        alert('File uploaded!');
    };

    const handleDelete = async (filePath) => {
        console.log("🗑 Deleting file:", filePath); // Debugging Log
    
        try {
            const response = await axios.delete('https://digital-library-production-c64a.up.railway.app/api/files/delete', {
                data: { filePath },  // ✅ Ensure correct filePath is sent
                headers: { 'Content-Type': 'application/json' },
            });
    
            console.log("✅ Delete Response:", response.data);
            fetchFiles();  
            alert('File deleted successfully!');
        } catch (error) {
            console.error("❌ Error deleting file:", error.response?.data || error.message);
            alert(error.response?.data.error || 'Failed to delete file');
        }
    };

    const years = Array.from({ length: 31 }, (_, i) => 2000 + i);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const filteredFiles = files.filter((file) => {
        const fileName = file.split('/').pop().toLowerCase();
        const fileYear = file.split('/')[1];
        const fileMonth = file.split('/')[2];

        return (
            fileName.includes(search.toLowerCase()) &&
            (filterYear === '' || filterYear === fileYear) &&
            (filterMonth === '' || filterMonth === fileMonth)
        );
    });

    return (
        <div className="container">
           <h1 className="header" style={{ backgroundColor: 'tomato', color: 'white' }}>
  <b>DIGITAL LIBRARY, DPO., NELLORE</b>
</h1>
<img src="/images/aplogo.png" alt="Trulli" width="120" height="120"></img>


            <img src="/images/dpo.png" alt="Smiley face" width="550" height="120" class= "pad"/>
                          

            
            <img src="/images/dlo.png" alt="Smiley face" width="165" height="120" class="align-right" />





            <div className="bg">
                {!isLoggedIn ? (
                    <div className="login-form">
                        <form onSubmit={handleLogin}>
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="login-input"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="login-input"
                            />
                            <button type="submit" className="button">
                                Login
                            </button>
                        </form>
                        {loginError && <p className="error">{loginError}</p>}
                    </div>
                ) : (
                    <>
                        <button onClick={handleLogout} className="logout-button">
                            Logout
                        </button>

                        {userRole === 'admin' && (
                            <>
                                <h1 style= {{ backgroundColor: 'gray', color: 'white' }} >UPLOAD THE FILE</h1>
                                <form className="upload-form" onSubmit={handleUpload}>
                                    <select
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="dropdown"
                                    >
                                        <option value="">Select Year</option>
                                        {years.map((yr) => (
                                            <option key={yr} value={yr}>
                                                {yr}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="dropdown"
                                    >
                                        <option value="">Select Month</option>
                                        {months.map((mn, index) => (
                                            <option key={index} value={mn}>
                                                {mn}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="file-input"
                                    />
                                    <button type="submit" className="button">
                                        Upload
                                    </button>
                                </form>
                            </>
                        )}

<h1 style= {{ backgroundColor: '#99ccff', color: 'black' }}>FILTERS</h1>
                        <div className="filters">
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="dropdown"
                            >
                                <option value="">Filter by Year</option>
                                {years.map((yr) => (
                                    <option key={yr} value={yr}>
                                        {yr}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="dropdown"
                            >
                                <option value="">Filter by Month</option>
                                {months.map((mn, index) => (
                                    <option key={index} value={mn}>
                                        {mn}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="text"
                                placeholder="Search by file name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-bar"
                            />
                        </div>

                        <h2 style= {{ backgroundColor: '#cc6699', color: 'black' }}><b>FILES</b></h2>
                        <table className="file-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>File Name</th>
                                    {userRole === 'admin' && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map((file, index) => {
                                    const fileName = file.split('/').pop();
                                    return (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <a
                                                    href={`https://digital-library-production-c64a.up.railway.app/uploads/${file}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {fileName}
                                                </a>
                                            </td>
                                            {userRole === 'admin' && (
                                                <td>
                                                    <button
                                                        onClick={() => handleDelete(file)}
                                                        className="delete-button"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
};

export default App;
