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
            axios.get('/api/workingcapital/excel').catch(() => ({ data: { banks: [] } })),
            axios.get('/api/loans'),
            axios.get('/api/debt'),
            axios.get('/api/movement'),
            axios.get('/api/cashflow/comments').catch(() => ({ data: { comment: '' } })),
            axios.get('/api/loans/excel').catch(() => ({ data: { shortTerm: [], longTerm: [] } })),
            axios.get('/api/debt/excel').catch(() => ({ data: {} })),
            axios.get('/api/movement/excel').catch(() => ({ data: null }))
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
                    banks: responses[3].data.banks || [],
                    regionWise: responses[3].data.regionWise || [],
                    countryWise: responses[3].data.countryWise || []
                },
                loans: {
                    loans: responses[4].data.loans || [],
                    excelData: responses[8].data || { shortTerm: [], longTerm: [] }
                },
                debt: {
                    kpi: responses[5].data,
                    allocations: responses[5].data.allocations || [],
                    reserves: responses[5].data.reserves || [],
                    excelData: responses[9].data || {}
                },
                movement: {
                    movements: responses[6].data.movements || [],
                    excelData: responses[10].data || null
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
