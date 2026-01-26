// using global fetch

async function debug() {
    try {
        const res = await fetch('http://localhost:3000/api/admin/periods', {
            headers: { 'Authorization': 'Bearer VH_BroodBaas' }
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

debug();
