# =================================
# Campus Facility Booking System
# =================================

# Compiler
CXX := g++

# C++ standard and warnings
CXXFLAGS := -std=c++11 -Wall -Wextra -O2

# Target executable name
TARGET := db1

# Automatically pick cpp files from /src
SRCS := $(wildcard src/*.cpp)

MYSQL_INC := $(shell mysql_config --cflags)
MYSQL_LIB := $(shell mysql_config --libs)

EXE := $(TARGET)
PLATFORM_FLAGS :=
RM := rm -f


# Default target
all: $(EXE)

# Build rule
$(EXE): $(SRCS)
	$(CXX) $(CXXFLAGS) $(PLATFORM_FLAGS) $(MYSQL_INC) $(SRCS) -o $(EXE) $(MYSQL_LIB)

# Clean rule
clean:
	$(RM) $(EXE)

.PHONY: all clean