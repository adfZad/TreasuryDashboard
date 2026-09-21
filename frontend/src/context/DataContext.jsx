import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [globalData, setGlobalData] = useState(null);
    const [globalLoading, setGlobalLoading] = useState(true);
    const [globalError, setGlobalError] = useState(false);

    const refreshData = () => {
        setGlobalLoading(true);
        setGlobalError(false);

        Promise.all([
            axios.get('/api/dashboard'),
            axios.get('/api/funds'),
            axios.get('/api/cashflow'),
            axios.get('/api/workingcapital'),
            axios.get('/api/loans'),
            axios.get('/api/debt'),
            axios.get('/api/movement'),
            axios.get('/api/cashflow/comments').catch(() => ({ data: { comment: '' } }))
        ]).then(responses => {
            setGlobalData({
                kpi: responses[0].data,
                funds: {
                    balances: responses[1].data.balances || [],
                    summary: responses[1].data.summary || { liquidityReserve: 0, workingCapitalReserve: 0 }
                },
                cashflow: {
                    forecasts: responses[2].data.forecasts || [],
                    comment: responses[7].data.comment || ''
                },
                wc: {
                    facilities: responses[3].data.facilities || []
                },
                loans: {
                    loans: responses[4].data.loans || []
                },
                debt: {
                    kpi: responses[5].data,
                    allocations: responses[5].data.allocations || [],
                    reserves: responses[5].data.reserves || []
                },
                movement: {
                    movements: responses[6].data.movements || []
                }
            });
        }).catch(err => {
            console.error('Error fetching global data:', err);
            setGlobalError(true);
        }).finally(() => {
            setGlobalLoading(false);
        });
    };

    useEffect(() => {
        refreshData();
    }, []);

    return (
        <DataContext.Provider value={{ globalData, globalLoading, globalError, refreshData }}>
            {children}
        </DataContext.Provider>
    );
};
