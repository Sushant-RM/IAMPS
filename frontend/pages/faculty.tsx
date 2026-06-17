import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Legacy route — faculty directory removed; send visitors to departments. */
export default function FacultyDirectoryRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/departments');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
    );
}
