import { useDispatch, useSelector } from "react-redux";

/** @typedef {import("./store").RootState} RootState */
/** @typedef {import("./store").AppDispatch} AppDispatch */

/** @type {() => AppDispatch} */
export const useAppDispatch = useDispatch;

/**
 * @template T
 * @param {(state: RootState) => T} selector
 * @returns {T}
 */
export const useAppSelector = useSelector;
