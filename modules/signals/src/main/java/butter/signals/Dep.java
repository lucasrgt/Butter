package butter.signals;

/** Internal dependency edge. Not part of the component author API. */
interface Dep {
    void add(Runnable listener);
    void remove(Runnable listener);
}
