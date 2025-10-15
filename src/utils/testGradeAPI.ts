// Test grade submission API
export const testGradeAPI = async () => {
    const token = localStorage.getItem('token');
    console.log('=== MANUAL TEST GRADE API ===');
    console.log('Token:', token);

    const params = new URLSearchParams();
    params.append('score', '8.5');
    params.append('feedback', 'Test feedback');

    const url = `http://localhost:8080/api/submissions/5/grade?${params.toString()}`;
    console.log('URL:', url);

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response statusText:', response.statusText);

        const data = await response.text();
        console.log('Response data:', data);

        return { status: response.status, data };
    } catch (error) {
        console.error('Fetch error:', error);
        return { status: 0, error };
    }
};

